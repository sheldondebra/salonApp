type AuthFlowParams = {
  plan?: string | null;
  intent?: string | null;
  next?: string | null;
};

function authQueryString(params: AuthFlowParams): string {
  const q = new URLSearchParams();
  if (params.plan) q.set("plan", params.plan);
  if (params.intent) q.set("intent", params.intent);
  if (params.next) q.set("next", params.next);
  const serialized = q.toString();
  return serialized ? `?${serialized}` : "";
}

export function loginHref(params: AuthFlowParams = {}): string {
  return `/login${authQueryString(params)}`;
}

export function registerHref(params: AuthFlowParams = {}): string {
  const intent = params.intent ?? (params.plan ? "salon" : null);
  return `/register${authQueryString({ ...params, intent })}`;
}
