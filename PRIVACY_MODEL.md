# UNDERWEB — Privacy Model & Threat Surface Analysis

---

## 1. Multi-Tier Privacy Surface Model

Underweb evaluates a website's privacy posture across four independent vectors:
1. **Third-Party Trackers & Advertising Beacons**:
   - Detection of tracking domains, fingerprinting scripts, and session replay recorders (e.g. Hotjar, Meta Pixel, Google Ads, Criteo).
2. **Cookie Security & Lifespans**:
   - Verification of `Secure`, `HttpOnly`, and `SameSite` compliance.
   - Flagging of persistent tracking cookies whose expiration dates exceed 400 days.
3. **Client-Side Persistent Storage**:
   - Auditing keys stored in `localStorage`, `sessionStorage`, and `indexedDB.databases()`.
   - Classification of storage keys into authentication tokens, tracking identifiers, or cached application state.
4. **Hardware & Sensor API Surveillance**:
   - Probing browser permission states (`geolocation`, `notifications`, `clipboard-read`, `camera`, `microphone`) to assess what sensitive device capabilities the site is capable of querying.

---

## 2. Privacy Score Formulation

The Underweb Privacy Score $P \in [10, 100]$ is computed as follows:

$$P = \max\left(10, \; 100 - \min(30, 6 \cdot T) - \min(20, 3 \cdot C_3) - \min(15, 4 \cdot I_c) - \min(15, 5 \cdot A_g)\right)$$

Where:
- $T$: Number of detected third-party trackers
- $C_3$: Number of third-party cookies set
- $I_c$: Number of cookie hygiene violations (e.g. missing `Secure` or insecure `SameSite=None`)
- $A_g$: Number of granted sensitive hardware permissions

### Classification:
- **`EXCELLENT`** ($P \ge 80$): Minimal third-party data collection and strict cookie flags.
- **`MODERATE`** ($60 \le P < 80$): Standard commercial web footprint with some analytics.
- **`INVASIVE`** ($P < 60$): Extensive ad network integrations, session recording, and permissive cookies.
