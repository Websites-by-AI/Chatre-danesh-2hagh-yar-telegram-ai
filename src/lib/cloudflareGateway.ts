/**
 * Cloudflare AI Gateway & Workers AI Resilient Client Wrapper
 * 
 * Provides robust orchestration, dynamic routing, message payload conversion,
 * and edge-network diagnostic interceptors for Cloudflare WAF and Downstream Timeouts.
 */

export interface UnifiedMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CloudflareGatewayConfig {
  accountId: string;
  gatewayId: string;
  apiToken: string;
  providerToken?: string; // Optional token for proxying standard provider-native auth
  useLegacyNativeEndpoint?: boolean; // Toggle fallback mapping
  skipCache?: boolean;
}

export interface GenerationOptions {
  model: string;
  messages: UnifiedMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

// Custom rich error types to pinpoint edge-network behavior
export class CloudflareApiError extends Error {
  constructor(
    public statusCode: number,
    public type: 'WAF_BLOCK' | 'TIMEOUT_GATEWAY' | 'UNAUTHORIZED_SCOPE' | 'UNKNOWN_PROXY_ERROR',
    message: string,
    public rawResponse?: string
  ) {
    super(message);
    this.name = 'CloudflareApiError';
  }
}

/**
 * Transforms generic messages array to Google Gemini's standard payload format
 */
export function mapToGeminiFormat(messages: UnifiedMessage[]) {
  const systemInstruction = messages.find(m => m.role === 'system')?.content;
  const filteredContents = messages.filter(m => m.role !== 'system');

  return {
    contents: filteredContents.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    })),
    ...(systemInstruction ? {
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      }
    } : {})
  };
}

/**
 * Transforms generic messages array to Anthropic Claude standard payload structures
 */
export function mapToAnthropicFormat(messages: UnifiedMessage[], temperature = 0.7, maxTokens = 1000) {
  const systemInstruction = messages.find(m => m.role === 'system')?.content || '';
  const filteredMessages = messages.filter(m => m.role !== 'system');

  return {
    model: "claude-3-5-sonnet-latest", // Default fallback model if not overridden
    max_tokens: maxTokens,
    temperature: temperature,
    system: systemInstruction,
    messages: filteredMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }))
  };
}

/**
 * Transforms generic messages array to OpenAI / OpenRouter format
 */
export function mapToOpenAiFormat(messages: UnifiedMessage[]) {
  return {
    messages: messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  };
}

/**
 * Principal highly-resilient client for Cloudflare AI Gateway & Workers AI completions
 */
export class CloudflareGatewayClient {
  constructor(private config: CloudflareGatewayConfig) {
    if (!config.accountId) {
      throw new Error("Cloudflare Account ID is required.");
    }
    if (!config.gatewayId) {
      throw new Error("Cloudflare AI Gateway ID is required.");
    }
    if (!config.apiToken) {
      throw new Error("Cloudflare API token is required for authentication.");
    }
  }

  /**
   * Universal fetch completion engine with detailed Cloudflare Edge diagnosers
   */
  async createChatCompletion(options: GenerationOptions): Promise<Response> {
    const { model, messages, temperature = 0.7, maxTokens = 1024, stream = false } = options;

    // 1. Establish URLs
    // REST API Endpoint: https://api.cloudflare.com/client/v4/accounts/{accountId}/ai/v1/chat/completions
    const standardRestUrl = `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/ai/v1/chat/completions`;
    
    // Legacy Provider Native Endpoint (e.g. gateway.ai.cloudflare.com)
    // Supports direct provider routing fallback proxy schemes
    const nativeGatewayUrl = `https://gateway.ai.cloudflare.com/v1/${this.config.accountId}/${this.config.gatewayId}/${this.getProviderSlug(model)}`;

    const targetUrl = this.config.useLegacyNativeEndpoint ? nativeGatewayUrl : standardRestUrl;

    // 2. Prepare request payload mapping
    let bodyPayload: Record<string, any> = {};

    if (model.includes("gemini")) {
      bodyPayload = {
        ...mapToGeminiFormat(messages),
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens
        }
      };
    } else if (model.includes("claude") || model.includes("anthropic")) {
      bodyPayload = mapToAnthropicFormat(messages, temperature, maxTokens);
    } else {
      // Default standard OpenAI / OpenRouter format
      bodyPayload = {
        model,
        ...mapToOpenAiFormat(messages),
        temperature,
        max_tokens: maxTokens,
        stream
      };
    }

    // 3. Assemble Resilient Headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.config.useLegacyNativeEndpoint) {
      // Shifting authentications dynamically when routing via legacy multi-tenant proxy gateways 
      // preventing header collision.
      if (this.config.providerToken) {
        headers['Authorization'] = `Bearer ${this.config.providerToken}`;
      }
      // Pass the Cloudflare credential in the dedicated non-standard header
      headers['cf-aig-authorization'] = `Bearer ${this.config.apiToken}`;
    } else {
      // Standard direct REST API access
      headers['Authorization'] = `Bearer ${this.config.apiToken}`;
    }

    // Dynamic Cloudflare control parameters
    headers['cf-aig-gateway-id'] = this.config.gatewayId;
    if (this.config.skipCache) {
      headers['cf-aig-skip-cache'] = 'true';
    }

    // 4. Execution with full Proxy Timeout & WAF interceptors
    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload)
      });

      if (!response.ok) {
        await this.handleEdgeError(response);
      }

      return response;
    } catch (err) {
      if (err instanceof CloudflareApiError) {
        throw err;
      }
      throw new Error(`Network failure during edge proxy traversal: ${(err as Error).message}`);
    }
  }

  /**
   * Helper slug identifier to format Cloudflare's dynamic routing models
   */
  private getProviderSlug(model: string): string {
    if (model.includes("gemini")) return "google-ai-studio";
    if (model.includes("claude") || model.includes("anthropic")) return "anthropic";
    if (model.includes("openai")) return "openai";
    return "openrouter";
  }

  /**
   * Parses backend HTTP states to isolate Cloudflare edge errors from downstream logic
   */
  private async handleEdgeError(response: Response): Promise<never> {
    const statusCode = response.status;
    let errorText = "";
    
    try {
      errorText = await response.text();
    } catch {
      errorText = "Could not parse response body.";
    }

    const lowerText = errorText.toLowerCase();

    // Challenge & WAF detection: Cloudflare standard security pages contain specific HTML strings
    if (
      statusCode === 403 && 
      (lowerText.includes("cloudflare") || 
       lowerText.includes("error code 1020") || 
       lowerText.includes("custom rule") ||
       lowerText.includes("waf") ||
       lowerText.includes("ray id"))
    ) {
      throw new CloudflareApiError(
        statusCode,
        'WAF_BLOCK',
        `[Cloudflare WAF Block] Access denied by firewall. Your IP or origin blocked by geo-filtering or security rules. Code: 403 Forbidden. Ray ID matched: ${response.headers.get('cf-ray') || 'Unknown'}`,
        errorText
      );
    }

    // Token & Scope permissions detection
    if (statusCode === 401 || (statusCode === 403 && lowerText.includes("permission") || lowerText.includes("scope") || lowerText.includes("unauthorized"))) {
      throw new CloudflareApiError(
        statusCode,
        'UNAUTHORIZED_SCOPE',
        `[Authorization Failure] Cloudflare API Token has insufficient permissions. Ensure your token is granted the 'AI Gateway (Edit)' or 'Workers AI (Edit)' scopes inside your client Dashboard. Check your CLOUDFLARE_TOKEN configuration.`,
        errorText
      );
    }

    // Timeout Traps (502 Gateway, 504 Gateway, Cloudflare 524 code)
    if (statusCode === 502 || statusCode === 504 || lowerText.includes("524") || lowerText.includes("host timeout")) {
      throw new CloudflareApiError(
        statusCode,
        'TIMEOUT_GATEWAY',
        `[Gateway Timeout] Downstream provider failed to complete execution in time or timed out. Consider falling back to another endpoint or skipping edge cache with 'cf-aig-skip-cache: true'.`,
        errorText
      );
    }

    // Non-specific error defaults
    throw new CloudflareApiError(
      statusCode,
      'UNKNOWN_PROXY_ERROR',
      `[CloudflareTrauma] Request failed at edge proxy with status ${statusCode}. Raw body response: ${errorText.substring(0, 500)}`,
      errorText
    );
  }
}
