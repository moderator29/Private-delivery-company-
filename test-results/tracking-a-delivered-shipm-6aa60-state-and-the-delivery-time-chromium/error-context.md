# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tracking.spec.ts >> a delivered shipment >> shows the delivered state and the delivery time
- Location: tests/e2e/tracking.spec.ts:93:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('The package has been delivered.')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('The package has been delivered.')

```

```yaml
- link "Skip to main content":
  - /url: "#main"
- banner:
  - link "SwiftTrack home":
    - /url: /
    - text: SwiftTrackPRIVATE DELIVERY COMPANY
  - link "SwiftTrack home":
    - /url: /
    - text: SwiftTrackPRIVATE DELIVERY COMPANY
  - navigation "Main":
    - list:
      - listitem:
        - link "Track":
          - /url: /track
      - listitem:
        - link "Ship":
          - /url: /ship
      - listitem:
        - link "Services":
          - /url: /services
      - listitem:
        - link "Business":
          - /url: /business
      - listitem:
        - link "Support":
          - /url: /support
  - button "United Arab Emirates flagAEChange region. Currently United Arab Emirates.":
    - img "United Arab Emirates flag"
    - text: AEChange region. Currently United Arab Emirates.
  - link "Sign In":
    - /url: /admin/login
  - button "Open menu"
- main:
  - heading "Tracking Result" [level=1]
  - text: Delivered
  - paragraph: Your package has been delivered.
  - text: "Tracking ID: STDE 11VE RED1 US"
  - button "Copy tracking number"
  - status
  - figure "Route built from recorded scan events. Cities are placed at their real coordinates. SwiftTrack does not publish live GPS positions. The latest confirmed scan is shown above.":
    - 'img "Route map from Dubai, United Arab Emirates to Miami, Florida, United States. Current status: Delivered."': DUBAI United Arab Emirates MIAMI United States
    - paragraph: Delivered
    - paragraph: Delivered
    - paragraph:
      - time: August 3, 2026 6:25 PM GST
    - text: Route built from recorded scan events. Cities are placed at their real coordinates. SwiftTrack does not publish live GPS positions. The latest confirmed scan is shown above.
  - heading "Shipment Progress" [level=2]
  - paragraph: Confirmed scans, followed by the milestones still expected.
  - list:
    - listitem:
      - paragraph: Shipment Information Received
      - paragraph:
        - time: July 29, 2026 9:00 AM GST
      - paragraph: Shipment details received and the waybill was created.
      - paragraph: Dubai, UAE
    - listitem:
      - paragraph: Picked Up
      - paragraph:
        - time: July 30, 2026 11:10 AM GST
      - paragraph: Collected from the sender.
      - paragraph: Dubai, UAE
    - listitem:
      - paragraph: Departed Origin Facility
      - paragraph:
        - time: July 30, 2026 5:05 PM GST
      - paragraph: Released from the Dubai gateway.
      - paragraph: Dubai, UAE
    - listitem:
      - paragraph: Arrived at Destination Country
      - paragraph:
        - time: August 2, 2026 1:30 PM GST
      - paragraph: Cleared customs in the destination country.
      - paragraph: Miami, Florida, USA
    - listitem:
      - paragraph: Out for Delivery
      - paragraph:
        - time: August 3, 2026 3:40 PM GST
      - paragraph: With a courier for delivery today.
      - paragraph: Miami, Florida, USA
    - listitem:
      - paragraph: Delivered
      - paragraph:
        - time: August 3, 2026 6:25 PM GST
      - paragraph: Handed to the recipient at the front desk.
      - paragraph: Miami, Florida, USA
  - heading "How was this delivery?" [level=2]
  - paragraph: Your rating helps us hold the network to a standard.
  - group "Your rating":
    - text: Your rating
    - radio "1 star, Poor"
    - text: 1 star, Poor
    - radio "2 stars, Fair"
    - text: 2 stars, Fair
    - radio "3 stars, Good"
    - text: 3 stars, Good
    - radio "4 stars, Very good"
    - text: 4 stars, Very good
    - radio "5 stars, Excellent"
    - text: 5 stars, Excellent
  - text: Anything you want to add? (optional)
  - textbox "Anything you want to add? (optional)":
    - /placeholder: The courier called ahead, which made it easy.
  - button "Submit rating" [disabled]
  - img "Parcel marked Box": Swift Track PRIVATE DELIVERY COMPANY
  - paragraph: From
  - img
  - paragraph: Layla Haddad
  - paragraph: Haddad Trading
  - paragraph: Dubai, United Arab Emirates
  - img "United Arab Emirates flag"
  - paragraph: To
  - img
  - paragraph: Marcus Bell
  - paragraph: 820 Brickell Key Drive
  - paragraph: Apt 1904
  - paragraph: Miami, Florida 33131
  - paragraph: United States
  - img "United States flag"
  - term: Service Type
  - definition: Express Delivery
  - term: Package Type
  - definition: Box
  - term: Pieces
  - definition: "2"
  - term: Weight
  - definition: 3.2 kg
  - term: Dimensions
  - definition: 30 x 22 x 4 cm
  - term: Status
  - definition: Delivered
  - term: Delivered
  - definition:
    - time: August 3, 2026 6:25 PM GST
  - paragraph: Latest scan location
  - paragraph: Miami, Florida
  - paragraph: Where the package was last scanned by our network. This is not a live position.
  - paragraph: Ordered On
  - paragraph:
    - time: July 29, 2026
  - paragraph: Transit Time
  - paragraph: 4 days
  - paragraph: Tracking ID
  - paragraph: STDE 11VE RED1 US
  - paragraph: Record
  - paragraph: 6 confirmed scans
  - paragraph:
    - text: Last updated
    - time: August 3, 2026 6:25 PM GST
  - button "Copy tracking link"
  - status: Shipment STDE11VERED1US is Delivered.
- contentinfo:
  - text: SwiftTrackPRIVATE DELIVERY COMPANY
  - paragraph: A private delivery company for shipments that need careful handling and a tracking record you can rely on.
  - link "support@swifttrack.example":
    - /url: mailto:support@swifttrack.example
  - link "+971 4 555 0142":
    - /url: tel:+97145550142
  - text: United Arab Emirates desk - Sunday to Thursday, 8:00 AM to 8:00 PM GST
  - navigation "Shipping":
    - heading "Shipping" [level=2]
    - list:
      - listitem:
        - link "Track a shipment":
          - /url: /track
      - listitem:
        - link "Send a shipment":
          - /url: /ship
      - listitem:
        - link "Delivery services":
          - /url: /services
      - listitem:
        - link "Business solutions":
          - /url: /business
  - navigation "Company":
    - heading "Company" [level=2]
    - list:
      - listitem:
        - link "About SwiftTrack":
          - /url: /about
      - listitem:
        - link "Support centre":
          - /url: /support
      - listitem:
        - link "Help and FAQ":
          - /url: /help
      - listitem:
        - link "Contact us":
          - /url: /contact
  - navigation "Legal":
    - heading "Legal" [level=2]
    - list:
      - listitem:
        - link "Privacy Policy":
          - /url: /legal/privacy
      - listitem:
        - link "Terms of Service":
          - /url: /legal/terms
  - paragraph: © 2026 SwiftTrack Private Delivery Company. All rights reserved.
  - text: Jebel Ali Free Zone, Building A4, Dubai, United Arab Emirates
  - paragraph: SwiftTrack is an independent private delivery company. It is not affiliated with, endorsed by, or acting on behalf of USPS, UPS, FedEx, DHL, any government agency, or any law enforcement body.
```

# Test source

```ts
  1   | import { expect, test } from "@playwright/test";
  2   | 
  3   | import {
  4   |   TRACKING_DELAYED,
  5   |   TRACKING_DELIVERED,
  6   |   TRACKING_IN_TRANSIT,
  7   |   TRACKING_UNKNOWN,
  8   |   collectConsoleErrors,
  9   | } from "./fixtures";
  10  | 
  11  | test.describe("tracking a valid shipment", () => {
  12  |   test.beforeEach(async ({ page }) => {
  13  |     await page.goto(`/track/${TRACKING_IN_TRANSIT}`);
  14  |   });
  15  | 
  16  |   test("shows the current status and the grouped tracking ID", async ({ page }) => {
  17  |     await expect(page.getByRole("heading", { name: "Tracking Result" })).toBeVisible();
  18  |     await expect(page.getByTestId("tracking-id")).toHaveText("STX9 8475 6532 US");
  19  |     // The status appears as the live chip beside the heading and again in the
  20  |     // detail table, so scope the assertion to the chip.
  21  |     await expect(page.getByText("In transit").first()).toBeVisible();
  22  |   });
  23  | 
  24  |   test("shows the route map with both endpoints", async ({ page }) => {
  25  |     const map = page.getByRole("img", { name: /Route map from .* to .*/ });
  26  |     await expect(map).toBeVisible();
  27  |     await expect(map).toHaveAttribute(
  28  |       "aria-label",
  29  |       /Dubai, United Arab Emirates.*Miami, Florida, United States/,
  30  |     );
  31  |     // Stated plainly on the page, because the marker is a progress summary.
  32  |     await expect(page.getByText("SwiftTrack does not publish live GPS positions.")).toBeVisible();
  33  |   });
  34  | 
  35  |   test("names the sender and the recipient", async ({ page }) => {
  36  |     await expect(page.getByText("Andrew Goodson")).toBeVisible();
  37  |     await expect(page.getByText("Rafael S Angarita")).toBeVisible();
  38  |     await expect(page.getByText("15440 SW 74th Circle Ct #604")).toBeVisible();
  39  |   });
  40  | 
  41  |   test("summarises the package and the delivery estimate", async ({ page }) => {
  42  |     await expect(page.getByText("Standard Delivery")).toBeVisible();
  43  |     await expect(page.getByText("0.05 kg")).toBeVisible();
  44  |     await expect(page.getByText("August 6, 2026")).toBeVisible();
  45  |     await expect(page.getByText("By 8:00 PM")).toBeVisible();
  46  |   });
  47  | });
  48  | 
  49  | test.describe("shipment progress", () => {
  50  |   test("lists recorded scans in order, then the milestones still expected", async ({ page }) => {
  51  |     await page.goto(`/track/${TRACKING_IN_TRANSIT}`);
  52  | 
  53  |     const progress = page.locator("ol").filter({ hasText: "Shipment Information Received" });
  54  |     const steps = progress.locator("> li");
  55  | 
  56  |     await expect(steps).toHaveCount(7);
  57  |     await expect(steps.nth(0)).toContainText("Shipment Information Received");
  58  |     await expect(steps.nth(1)).toContainText("Picked Up");
  59  |     await expect(steps.nth(2)).toContainText("Departed Origin Facility");
  60  |     await expect(steps.nth(3)).toContainText("In Transit");
  61  |     await expect(steps.nth(4)).toContainText("Arrived at Destination Country");
  62  |     await expect(steps.nth(5)).toContainText("Out for Delivery");
  63  |     await expect(steps.nth(6)).toContainText("Delivered");
  64  |   });
  65  | 
  66  |   test("timestamps the recorded scans in chronological order", async ({ page }) => {
  67  |     await page.goto(`/track/${TRACKING_IN_TRANSIT}`);
  68  | 
  69  |     const progress = page.locator("ol").filter({ hasText: "Shipment Information Received" });
  70  |     const stamps = await progress.locator("> li time").evaluateAll((nodes) =>
  71  |       nodes.map((node) => node.getAttribute("datetime") ?? ""),
  72  |     );
  73  | 
  74  |     expect(stamps).toHaveLength(4);
  75  |     const sorted = [...stamps].sort((a, b) => Date.parse(a) - Date.parse(b));
  76  |     expect(stamps).toEqual(sorted);
  77  |   });
  78  | 
  79  |   test("labels future milestones as expected rather than dating them", async ({ page }) => {
  80  |     await page.goto(`/track/${TRACKING_IN_TRANSIT}`);
  81  | 
  82  |     const progress = page.locator("ol").filter({ hasText: "Shipment Information Received" });
  83  |     // Three milestones remain after "In Transit", each shown without a time.
  84  |     await expect(progress.getByText("Expected", { exact: true })).toHaveCount(3);
  85  | 
  86  |     const projected = progress.locator("> li").nth(6);
  87  |     await expect(projected).toContainText("Expected");
  88  |     await expect(projected.locator("time")).toHaveCount(0);
  89  |   });
  90  | });
  91  | 
  92  | test.describe("a delivered shipment", () => {
  93  |   test("shows the delivered state and the delivery time", async ({ page }) => {
  94  |     await page.goto(`/track/${TRACKING_DELIVERED}`);
  95  | 
  96  |     await expect(page.getByText("Delivered").first()).toBeVisible();
> 97  |     await expect(page.getByText("The package has been delivered.")).toBeVisible();
      |                                                                     ^ Error: expect(locator).toBeVisible() failed
  98  |     await expect(page.getByText("August 3, 2026 6:25 PM GST")).toBeVisible();
  99  |   });
  100 | 
  101 |   test("offers the rating form", async ({ page }) => {
  102 |     await page.goto(`/track/${TRACKING_DELIVERED}`);
  103 | 
  104 |     await expect(page.getByRole("heading", { name: "How was this delivery?" })).toBeVisible();
  105 |     await expect(page.getByRole("radio", { name: /5 stars/ })).toBeAttached();
  106 |     // The button stays disabled until a rating is chosen.
  107 |     const submit = page.getByRole("button", { name: "Submit rating" });
  108 |     await expect(submit).toBeDisabled();
  109 |     await page.getByRole("radio", { name: /4 stars/ }).check();
  110 |     await expect(submit).toBeEnabled();
  111 |   });
  112 | 
  113 |   test("stops projecting milestones once the journey is over", async ({ page }) => {
  114 |     await page.goto(`/track/${TRACKING_DELIVERED}`);
  115 | 
  116 |     const progress = page.locator("ol").filter({ hasText: "Shipment Information Received" });
  117 |     await expect(progress.locator("> li")).toHaveCount(6);
  118 |     await expect(progress.getByText("Expected", { exact: true })).toHaveCount(0);
  119 |   });
  120 | 
  121 |   test("does not offer a rating form on a shipment still in transit", async ({ page }) => {
  122 |     await page.goto(`/track/${TRACKING_IN_TRANSIT}`);
  123 |     await expect(page.getByRole("heading", { name: "How was this delivery?" })).toHaveCount(0);
  124 |   });
  125 | });
  126 | 
  127 | test.describe("a shipment needing attention", () => {
  128 |   test("raises the alert and keeps the route marker still", async ({ page }) => {
  129 |     await page.goto(`/track/${TRACKING_DELAYED}`);
  130 | 
  131 |     const alert = page.getByRole("alert").filter({ hasText: "This shipment is marked delayed" });
  132 |     await expect(alert).toBeVisible();
  133 |     await expect(alert).toContainText("Contact support with your tracking number");
  134 | 
  135 |     // The delay itself is a recorded scan, so it appears in the timeline.
  136 |     await expect(page.getByText("Delayed in Transit")).toBeVisible();
  137 |   });
  138 | 
  139 |   test("does not raise the alert on a healthy shipment", async ({ page }) => {
  140 |     await page.goto(`/track/${TRACKING_IN_TRANSIT}`);
  141 |     await expect(page.getByText(/This shipment is marked/)).toHaveCount(0);
  142 |   });
  143 | });
  144 | 
  145 | test.describe("an unknown tracking number", () => {
  146 |   test("shows the polished not-found state", async ({ page }) => {
  147 |     const response = await page.goto(`/track/${TRACKING_UNKNOWN}`);
  148 | 
  149 |     expect(response?.status()).toBe(200);
  150 |     await expect(page.getByRole("heading", { name: "We could not find that shipment" })).toBeVisible();
  151 |     await expect(page.getByText("No shipment matches that tracking number")).toBeVisible();
  152 |     // A dead end is not acceptable: the visitor is offered another try.
  153 |     await expect(page.getByTestId("tracking-input")).toBeVisible();
  154 |     await expect(page.getByRole("link", { name: "Tracking support" })).toBeVisible();
  155 |   });
  156 | 
  157 |   test("leaks no database or infrastructure wording", async ({ page }) => {
  158 |     const errors = collectConsoleErrors(page);
  159 |     await page.goto(`/track/${TRACKING_UNKNOWN}`);
  160 | 
  161 |     const body = (await page.locator("body").innerText()).toLowerCase();
  162 |     for (const leak of [
  163 |       "supabase",
  164 |       "postgres",
  165 |       "postgrest",
  166 |       "sql",
  167 |       "database",
  168 |       "rpc",
  169 |       "null",
  170 |       "undefined",
  171 |       "stack",
  172 |       "pgrst",
  173 |     ]) {
  174 |       expect(body, `not-found page must not mention "${leak}"`).not.toContain(leak);
  175 |     }
  176 | 
  177 |     expect(errors).toEqual([]);
  178 |   });
  179 | 
  180 |   test("answers a malformed number exactly as it answers an unknown one", async ({ page }) => {
  181 |     // Distinguishing them would confirm which well formed numbers are real.
  182 |     await page.goto("/track/NOT-A-TRACKING-NUMBER");
  183 |     await expect(page.getByRole("heading", { name: "We could not find that shipment" })).toBeVisible();
  184 |   });
  185 | });
  186 | 
```