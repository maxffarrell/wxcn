# DNS-AID

wxcn's production origin is `https://wxcn.dev`, and its Worker custom domain is
declared in `apps/web/wrangler.jsonc`. That Wrangler configuration does not own
DNS zone records, DNSSEC, or a DNS-AID service endpoint. Do not infer DNS-AID
readiness from a successful Worker deployment.

## Publication

The example in [`dns-aid.zone.example`](./dns-aid.zone.example) is an operator
template, not a record that is safe to apply unchanged. DNS-AID uses ServiceMode
SVCB/HTTPS records below `_agents` and requires at least `alpn` and `port` for an
advertised service. The target and ALPN must describe a service that is actually
available; this repository currently does not declare an MCP or A2A endpoint.

If an endpoint is added, publish the record at the canonical `wxcn.dev` zone,
not at a Cloudflare `workers.dev` hostname. Keep priority at `1` or greater,
use `HTTPS` for an HTTPS endpoint (or `SVCB` for another protocol), and include
`mandatory="alpn,port"` when clients must understand those parameters.

DNSSEC is an external prerequisite. Enable signing at the authoritative provider,
publish the resulting DS record at the registrar, and require validating
resolvers to reject bogus or unsigned discovery data. This repository cannot
prove either condition from `wrangler.jsonc`.

## Verification evidence

After an operator publishes a real record, capture all of the following against
`wxcn.dev`:

```sh
dig +short HTTPS _index._agents.wxcn.dev
dig +dnssec +cd HTTPS _index._agents.wxcn.dev
dig +short DS wxcn.dev
```

The first command must show a real ServiceMode record with the intended target,
`alpn`, and `port`. The second must include an `RRSIG` covering the answer, and
the third must return a DS record. These live DNS results, plus an endpoint
protocol check, are required before reporting DNS-AID as enabled; local config
validation alone is not production proof.

The repository-only check is:

```sh
pnpm dns-aid:check
```

It validates that the checked-in template remains explicitly non-deployable and
retains the RFC 9460/DNS-AID safety requirements. It does not query or mutate
external DNS.

References: [DNS-AID draft](https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/),
[RFC 9460](https://www.rfc-editor.org/rfc/rfc9460.html), and
[RFC 4033](https://www.rfc-editor.org/rfc/rfc4033).
