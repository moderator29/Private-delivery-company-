# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tracking-form.spec.ts >> the tracking form on the home page >> associates the error with the field for assistive technology
- Location: tests/e2e/tracking-form.spec.ts:57:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByTestId('tracking-input').first()
    - locator resolved to <input value="" name="id" type="text" inputmode="text" autocomplete="off" spellcheck="false" id="tracking-number" autocapitalize="characters" data-testid="tracking-input" placeholder="STX9 8475 6532 US" class="w-full rounded-full border bg-white font-semibold tracking-wide text-ink-900 placeholder:font-normal placeholder:tracking-normal placeholder:text-ink-400 focus:outline-none sm:border-transparent sm:shadow-none h-12 pr-3.5 pl-11 text-[15px] border-ink-200"/>
    - fill("junk")
  - attempting fill action
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
      - waiting 100ms
    58 × waiting for element to be visible, enabled and editable
       - element is not visible
     - retrying fill action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main"
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e5]:
        - link "SwiftTrack home" [ref=e7] [cursor=pointer]:
          - /url: /
          - generic [ref=e25]:
            - generic [ref=e26]: SwiftTrack
            - text: PRIVATE DELIVERY COMPANY
        - link "SwiftTrack home" [ref=e28] [cursor=pointer]:
          - /url: /
          - generic [ref=e46]:
            - generic [ref=e47]: SwiftTrack
            - text: PRIVATE DELIVERY COMPANY
        - navigation "Main" [ref=e48]:
          - list [ref=e49]:
            - listitem [ref=e50]:
              - link "Track" [ref=e51] [cursor=pointer]:
                - /url: /track
            - listitem [ref=e52]:
              - link "Ship" [ref=e53] [cursor=pointer]:
                - /url: /ship
            - listitem [ref=e56]:
              - link "Services" [ref=e57] [cursor=pointer]:
                - /url: /services
            - listitem [ref=e60]:
              - link "Business" [ref=e61] [cursor=pointer]:
                - /url: /business
            - listitem [ref=e64]:
              - link "Support" [ref=e65] [cursor=pointer]:
                - /url: /support
        - generic [ref=e68]:
          - button "United Arab Emirates flagAEChange region. Currently United Arab Emirates." [ref=e69]:
            - img "United Arab Emirates flag" [ref=e74]
            - text: AE
            - generic [ref=e79]: Change region. Currently United Arab Emirates.
          - link "Sign In" [ref=e81] [cursor=pointer]:
            - /url: /admin/login
          - button "Open menu" [ref=e82]
    - main [ref=e85]:
      - generic [ref=e88]:
        - generic [ref=e89]:
          - paragraph [ref=e90]: Dubai based private delivery company
          - heading "Deliveries handled privately, tracked end to end." [level=1] [ref=e91]:
            - generic [ref=e92]: Deliveries
            - generic [ref=e93]: handled
            - generic [ref=e94]: privately,
            - generic [ref=e95]: tracked
            - generic [ref=e96]: end
            - generic [ref=e97]: to
            - generic [ref=e98]: end.
          - paragraph [ref=e99]: SwiftTrack moves documents, parcels and freight out of Dubai to the places our customers do business, and publishes an honest record of every scan along the way.
          - list [ref=e100]:
            - listitem [ref=e101]: Every handover scanned and timestamped
            - listitem [ref=e107]: Private handling from collection to delivery
            - listitem [ref=e112]: Dubai gateway, international reach
          - generic [ref=e117]:
            - link "Send a shipment" [ref=e118] [cursor=pointer]:
              - /url: /ship
            - link "Explore services" [ref=e119] [cursor=pointer]:
              - /url: /services
        - generic [ref=e120]:
          - heading "Track a shipment" [level=2] [ref=e121]
          - paragraph [ref=e122]: Enter the tracking number from your shipping confirmation.
          - generic [ref=e123]:
            - text: Tracking number
            - generic [ref=e124]:
              - textbox "STX9 8475 6532 US" [ref=e129]
              - button "Track Shipment" [ref=e130]
            - paragraph
          - paragraph [ref=e134]: Tracking numbers look like STX9 8475 6532 US. Spaces, dashes and lower case are all fine, we normalise them for you.
      - region "Quick actions" [ref=e135]:
        - list [ref=e137]:
          - listitem [ref=e138]:
            - link [ref=e139] [cursor=pointer]:
              - /url: /track
              - generic [ref=e144]:
                - generic [ref=e145]: Track
                - text: Find a shipment by its number
          - listitem [ref=e148]:
            - link [ref=e149] [cursor=pointer]:
              - /url: /ship
              - generic [ref=e154]:
                - generic [ref=e155]: Ship
                - text: Book a collection from Dubai
          - listitem [ref=e158]:
            - link [ref=e159] [cursor=pointer]:
              - /url: /services
              - generic [ref=e166]:
                - generic [ref=e167]: Services
                - text: Compare delivery speeds
          - listitem [ref=e170]:
            - link [ref=e171] [cursor=pointer]:
              - /url: /support
              - generic [ref=e176]:
                - generic [ref=e177]: Support
                - text: Understand a status
      - generic [ref=e181]:
        - generic [ref=e182]:
          - paragraph [ref=e183]: Why SwiftTrack
          - heading "Built for shipments that actually matter" [level=2] [ref=e184]
          - paragraph [ref=e185]: A smaller, private network with fewer handoffs and a clearer record of what happened to your package.
        - generic [ref=e186]:
          - generic [ref=e187]:
            - heading "Private by default" [level=3] [ref=e192]
            - paragraph [ref=e193]: Shipment contents, addresses and contact details stay with the people who need them. Public tracking shows the route and the scans, never the personal details behind them.
          - generic [ref=e194]:
            - heading "A tracking record you can check" [level=3] [ref=e200]
            - paragraph [ref=e201]: Every scan is timestamped and placed. When an estimate changes, the reason appears on the timeline instead of the date quietly moving.
          - generic [ref=e202]:
            - heading "Handled through one gateway" [level=3] [ref=e209]
            - paragraph [ref=e210]: Collection, export handling and linehaul all run through our own Dubai facility, so a shipment does not change hands between companies before it has even left the country.
          - generic [ref=e211]:
            - heading "Support that can see the shipment" [level=3] [ref=e216]
            - paragraph [ref=e217]: Our team works from the same operational record you see, plus the internal notes, so you get an answer rather than a status page read back to you.
      - generic [ref=e219]:
        - generic [ref=e220]:
          - paragraph [ref=e221]: How it works
          - heading "Four stages, each one scanned" [level=2] [ref=e222]
          - paragraph [ref=e223]: Nothing appears on your tracking page until it has actually happened.
        - list [ref=e224]:
          - listitem [ref=e225]:
            - generic [ref=e226]:
              - text: "01"
              - heading "Booked and labelled" [level=3] [ref=e227]
              - paragraph [ref=e228]: We create the shipment, generate a tracking number and schedule the pickup window.
          - listitem [ref=e229]:
            - generic [ref=e230]:
              - text: "02"
              - heading "Collected" [level=3] [ref=e231]
              - paragraph [ref=e232]: A SwiftTrack courier collects the shipment and records the first scan at the Dubai gateway.
          - listitem [ref=e233]:
            - generic [ref=e234]:
              - text: "03"
              - heading "Cleared and flown" [level=3] [ref=e235]
              - paragraph [ref=e236]: Export documentation is presented, the shipment departs on linehaul, and it is scanned again on arrival in the destination country.
          - listitem [ref=e237]:
            - generic [ref=e238]:
              - text: "04"
              - heading "Delivered" [level=3] [ref=e239]
              - paragraph [ref=e240]: The final courier completes delivery and the shipment is closed with a delivery scan.
      - generic [ref=e242]:
        - generic [ref=e243]:
          - paragraph [ref=e244]: Our record
          - heading "Numbers from our own database, not a brochure" [level=2] [ref=e245]
          - paragraph [ref=e246]: Computed live from completed shipments and customer ratings each time this page is served. When there is not enough data behind a figure, we say so instead of publishing one.
        - generic [ref=e248]:
          - generic [ref=e250]:
            - paragraph [ref=e251]: Deliveries completed
            - paragraph [ref=e252]: "128"
            - paragraph [ref=e253]: Shipments delivered and closed.
          - generic [ref=e255]:
            - paragraph [ref=e256]: Delivered on time
            - paragraph [ref=e257]:
              - generic [ref=e258]: 97.7%
            - paragraph [ref=e259]: Delivered on or before the estimated date, across shipments that carried an estimate.
          - generic [ref=e261]:
            - paragraph [ref=e262]: Average transit
            - paragraph [ref=e263]: 4.2days
            - paragraph [ref=e264]: Days from pickup scan to delivery scan.
          - generic [ref=e266]:
            - paragraph [ref=e267]: Customer rating
            - paragraph [ref=e268]:
              - generic [ref=e269]: "4.8"
            - paragraph [ref=e281]: From 41 rated deliveries.
      - generic [ref=e283]:
        - generic [ref=e284]:
          - generic [ref=e285]:
            - paragraph [ref=e286]: Worth reading
            - heading "Shipping well is mostly knowing what matters" [level=2] [ref=e287]
            - paragraph [ref=e288]: Three things our operations team explains most often.
          - link "Read the help centre" [ref=e289] [cursor=pointer]:
            - /url: /help
        - generic [ref=e292]:
          - link [ref=e294] [cursor=pointer]:
            - /url: /ship
            - generic [ref=e295]: Sending something
            - generic [ref=e322]:
              - heading "What to get right before we knock" [level=3] [ref=e323]
              - paragraph [ref=e324]: Packaging, declared value and customs paperwork decide whether a shipment sails through a border or sits at it. Four things worth ten minutes.
              - generic [ref=e325]: How to prepare a shipment
          - link [ref=e329] [cursor=pointer]:
            - /url: /services
            - generic [ref=e330]: Crossing borders
            - generic [ref=e355]:
              - heading "Five service levels, one tracking record" [level=3] [ref=e356]
              - paragraph [ref=e357]: Standard through to same day, plus managed freight. What changes is how fast it departs and how closely it is watched, never the quality of the record.
              - generic [ref=e358]: Compare service levels
          - link [ref=e362] [cursor=pointer]:
            - /url: /business
            - generic [ref=e363]: Shipping regularly
            - generic [ref=e416]:
              - heading "Accounts built around your lanes" [level=3] [ref=e417]
              - paragraph [ref=e418]: Scheduled collections, customs documentation prepared in advance, and an operations contact who knows which of your shipments cannot slip.
              - generic [ref=e419]: See business solutions
      - generic [ref=e423]:
        - generic [ref=e424]:
          - generic [ref=e425]:
            - paragraph [ref=e426]: Services
            - heading "Choose the level of urgency" [level=2] [ref=e427]
            - paragraph [ref=e428]: Every service level uses the same network and the same tracking record.
          - link "All services" [ref=e429] [cursor=pointer]:
            - /url: /services
        - generic [ref=e432]:
          - generic [ref=e433]:
            - heading "Parcel delivery" [level=3] [ref=e438]
            - paragraph [ref=e439]: Standard and express handling for boxes, envelopes and padded parcels.
          - generic [ref=e440]:
            - heading "Priority and same day" [level=3] [ref=e445]
            - paragraph [ref=e446]: Time critical movements within a metro area or between nearby regions.
          - generic [ref=e447]:
            - heading "Managed freight" [level=3] [ref=e452]
            - paragraph [ref=e453]: Larger consignments handled as a single tracked shipment with a scheduled delivery appointment.
      - generic [ref=e457]:
        - generic [ref=e458]:
          - heading "A shipment that needs attention?" [level=2] [ref=e459]
          - paragraph [ref=e460]: Our support team can look into a shipment that has stalled, been marked delayed, or needs a delivery change. They work from the same operational record you see, plus the internal notes. Have the tracking number ready.
          - paragraph [ref=e461]: Sunday to Thursday, 8:00 AM to 8:00 PM GST
        - generic [ref=e462]:
          - link "Contact support" [ref=e463] [cursor=pointer]:
            - /url: /contact
          - link "Tracking help" [ref=e464] [cursor=pointer]:
            - /url: /support
    - contentinfo [ref=e465]:
      - generic [ref=e466]:
        - generic [ref=e467]:
          - generic [ref=e468]:
            - generic [ref=e486]:
              - generic [ref=e487]: SwiftTrack
              - text: PRIVATE DELIVERY COMPANY
            - paragraph [ref=e488]: A private delivery company for shipments that need careful handling and a tracking record you can rely on.
            - generic [ref=e489]:
              - link "support@swifttrack.example" [ref=e490] [cursor=pointer]:
                - /url: mailto:support@swifttrack.example
              - link "+971 4 555 0142" [ref=e494] [cursor=pointer]:
                - /url: tel:+97145550142
              - generic [ref=e497]: United Arab Emirates desk - Sunday to Thursday, 8:00 AM to 8:00 PM GST
          - navigation "Shipping" [ref=e498]:
            - heading "Shipping" [level=2] [ref=e499]
            - list [ref=e500]:
              - listitem [ref=e501]:
                - link "Track a shipment" [ref=e502] [cursor=pointer]:
                  - /url: /track
              - listitem [ref=e503]:
                - link "Send a shipment" [ref=e504] [cursor=pointer]:
                  - /url: /ship
              - listitem [ref=e505]:
                - link "Delivery services" [ref=e506] [cursor=pointer]:
                  - /url: /services
              - listitem [ref=e507]:
                - link "Business solutions" [ref=e508] [cursor=pointer]:
                  - /url: /business
          - navigation "Company" [ref=e509]:
            - heading "Company" [level=2] [ref=e510]
            - list [ref=e511]:
              - listitem [ref=e512]:
                - link "About SwiftTrack" [ref=e513] [cursor=pointer]:
                  - /url: /about
              - listitem [ref=e514]:
                - link "Support centre" [ref=e515] [cursor=pointer]:
                  - /url: /support
              - listitem [ref=e516]:
                - link "Help and FAQ" [ref=e517] [cursor=pointer]:
                  - /url: /help
              - listitem [ref=e518]:
                - link "Contact us" [ref=e519] [cursor=pointer]:
                  - /url: /contact
          - navigation "Legal" [ref=e520]:
            - heading "Legal" [level=2] [ref=e521]
            - list [ref=e522]:
              - listitem [ref=e523]:
                - link "Privacy Policy" [ref=e524] [cursor=pointer]:
                  - /url: /legal/privacy
              - listitem [ref=e525]:
                - link "Terms of Service" [ref=e526] [cursor=pointer]:
                  - /url: /legal/terms
        - generic [ref=e527]:
          - paragraph [ref=e528]: © 2026 SwiftTrack Private Delivery Company. All rights reserved.
          - generic [ref=e529]: Jebel Ali Free Zone, Building A4, Dubai, United Arab Emirates
        - paragraph [ref=e530]: SwiftTrack is an independent private delivery company. It is not affiliated with, endorsed by, or acting on behalf of USPS, UPS, FedEx, DHL, any government agency, or any law enforcement body.
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | import { TRACKING_IN_TRANSIT } from "./fixtures";
  4  | 
  5  | test.describe("the tracking form on the home page", () => {
  6  |   test("navigates to the shipment when a valid number is submitted", async ({ page }) => {
  7  |     await page.goto("/");
  8  | 
  9  |     await page.getByTestId("tracking-input").first().fill(TRACKING_IN_TRANSIT);
  10 |     await page.getByTestId("track-submit").first().click();
  11 | 
  12 |     await expect(page).toHaveURL(`/track/${TRACKING_IN_TRANSIT}`);
  13 |     await expect(page.getByTestId("tracking-id")).toHaveText("STX9 8475 6532 US");
  14 |   });
  15 | 
  16 |   test("accepts the spaced form a customer copies from an email", async ({ page }) => {
  17 |     await page.goto("/");
  18 | 
  19 |     await page.getByTestId("tracking-input").first().fill("stx9 8475 6532 us");
  20 |     await page.getByTestId("track-submit").first().click();
  21 | 
  22 |     await expect(page).toHaveURL(`/track/${TRACKING_IN_TRANSIT}`);
  23 |   });
  24 | 
  25 |   test("shows an inline error for junk and stays on the page", async ({ page }) => {
  26 |     await page.goto("/");
  27 | 
  28 |     await page.getByTestId("tracking-input").first().fill("not-a-tracking-number");
  29 |     await page.getByTestId("track-submit").first().click();
  30 | 
  31 |     const error = page.getByRole("alert").filter({ hasText: "A SwiftTrack tracking number is 14" });
  32 |     await expect(error).toBeVisible();
  33 |     await expect(page).toHaveURL("/");
  34 |   });
  35 | 
  36 |   test("asks for a number when the field is empty, without navigating", async ({ page }) => {
  37 |     await page.goto("/");
  38 | 
  39 |     await page.getByTestId("track-submit").first().click();
  40 | 
  41 |     await expect(page.getByText("Enter a tracking number to continue.")).toBeVisible();
  42 |     await expect(page).toHaveURL("/");
  43 |   });
  44 | 
  45 |   test("clears the error as soon as the visitor starts correcting it", async ({ page }) => {
  46 |     await page.goto("/");
  47 | 
  48 |     const input = page.getByTestId("tracking-input").first();
  49 |     await input.fill("junk");
  50 |     await page.getByTestId("track-submit").first().click();
  51 |     await expect(page.getByRole("alert")).toBeVisible();
  52 | 
  53 |     await input.fill(TRACKING_IN_TRANSIT);
  54 |     await expect(page.getByRole("alert")).toHaveCount(0);
  55 |   });
  56 | 
  57 |   test("associates the error with the field for assistive technology", async ({ page }) => {
  58 |     await page.goto("/");
  59 | 
  60 |     const input = page.getByTestId("tracking-input").first();
> 61 |     await input.fill("junk");
     |                 ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  62 |     await page.getByTestId("track-submit").first().click();
  63 | 
  64 |     await expect(input).toHaveAttribute("aria-invalid", "true");
  65 |     await expect(input).toHaveAttribute("aria-describedby", "tracking-number-error");
  66 |   });
  67 | });
  68 | 
  69 | test.describe("the tracking form without JavaScript", () => {
  70 |   test.use({ javaScriptEnabled: false });
  71 | 
  72 |   test("still works as a GET form that redirects to the shipment", async ({ page }) => {
  73 |     // The form posts to /track with ?id=, which is the no-JS fallback path.
  74 |     await page.goto("/");
  75 |     await page.getByTestId("tracking-input").first().fill(TRACKING_IN_TRANSIT);
  76 |     await page.getByTestId("track-submit").first().click();
  77 | 
  78 |     await expect(page).toHaveURL(`/track/${TRACKING_IN_TRANSIT}`);
  79 |   });
  80 | 
  81 |   test("explains an invalid number on the tracking page", async ({ page }) => {
  82 |     await page.goto("/track?id=junk");
  83 |     await expect(
  84 |       page.getByText("That does not look like a SwiftTrack tracking number"),
  85 |     ).toBeVisible();
  86 |   });
  87 | });
  88 | 
```