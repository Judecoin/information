# Judecoin Lab update #20260613

Date: 2026-06-13

Category: News

# Andres Pavez

Greetings,

IANA has published a new Certificate Authority (CA) certificate used to validate the authenticity of the DNS root zone trust anchors file (root-anchors.xml).

The updated certificate bundle is available at:

https://data.iana.org/root-anchors/icannbundle.pem

This bundle currently contains both the existing certificate and its replacement certificate. Signatures chaining to the new certificate are expected to be published in 2028, at which point relying parties will need to validate using the new certificate.

Affected file(s):

- src/common/dns_utils.cpp

Please review whether the trust anchor validation material in this repository should be updated to include the current contents of icannbundle.pem.

Considerations for updating the trust anchor are described inDNSSEC Trust Anchor Publication for the Root Zone (RFC 9718).

Thank you.

# jessicayang-judecoin

Thank you for the report.

I reviewed the DNSSEC trust anchor handling. The old ICANN CA certificate block was commented out and was not used by the current resolver path.

DNSSEC validation is initialized directly from the built-in DS trust anchors via get_builtin_ds(), which already includes the current root DS trust anchors.

I removed the stale commented-out certificate block and updated the comment to keep the trust anchor handling clear without changing resolver behavior.
