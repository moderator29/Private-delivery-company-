# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tracking-form.spec.ts >> the tracking form without JavaScript >> still works as a GET form that redirects to the shipment
- Location: tests/e2e/tracking-form.spec.ts:72:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByTestId('tracking-input').first()
    - locator resolved to <input value="" name="id" type="text" inputmode="text" autocomplete="off" spellcheck="false" id="tracking-number" autocapitalize="characters" data-testid="tracking-input" placeholder="STX9 8475 6532 US" class="w-full rounded-full border bg-white font-semibold tracking-wide text-ink-900 placeholder:font-normal placeholder:tracking-normal placeholder:text-ink-400 focus:outline-none sm:border-transparent sm:shadow-none h-12 pr-3.5 pl-11 text-[15px] border-ink-200"/>
    - fill("STX984756532US")
  - attempting fill action
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
    - waiting 20ms
  - element was detached from the DOM, retrying

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
            - generic [ref=e27]: PRIVATE DELIVERY COMPANY
        - navigation "Main" [ref=e28]:
          - list [ref=e29]:
            - listitem [ref=e30]:
              - link "Track" [ref=e31] [cursor=pointer]:
                - /url: /track
            - listitem [ref=e33]:
              - link "Ship" [ref=e34] [cursor=pointer]:
                - /url: /ship
            - listitem [ref=e38]:
              - link "Services" [ref=e39] [cursor=pointer]:
                - /url: /services
            - listitem [ref=e43]:
              - link "Business" [ref=e44] [cursor=pointer]:
                - /url: /business
            - listitem [ref=e48]:
              - link "Support" [ref=e49] [cursor=pointer]:
                - /url: /support
        - generic [ref=e53]:
          - button "United Arab Emirates flag AE Change region. Currently United Arab Emirates." [ref=e54]:
            - img "United Arab Emirates flag" [ref=e59]
            - generic [ref=e64]: AE
            - generic [ref=e65]: Change region. Currently United Arab Emirates.
          - link "Sign In" [ref=e67] [cursor=pointer]:
            - /url: /admin/login
    - main [ref=e68]:
      - generic [ref=e71]:
        - generic [ref=e72]:
          - paragraph [ref=e73]: Dubai based private delivery company
          - heading "Deliveries handled privately, tracked end to end." [level=1] [ref=e75]:
            - generic [ref=e76]: Deliveries
            - generic [ref=e78]: handled
            - generic [ref=e80]: privately,
            - generic [ref=e82]: tracked
            - generic [ref=e84]: end
            - generic [ref=e86]: to
            - generic [ref=e88]: end.
          - paragraph [ref=e90]: SwiftTrack moves documents, parcels and freight out of Dubai to the places our customers do business, and publishes an honest record of every scan along the way.
          - list [ref=e91]:
            - listitem [ref=e92]: Every handover scanned and timestamped
            - listitem [ref=e98]: Private handling from collection to delivery
            - listitem [ref=e103]: Dubai gateway, international reach
          - generic [ref=e108]:
            - link "Send a shipment" [ref=e109] [cursor=pointer]:
              - /url: /ship
            - link "Explore services" [ref=e110] [cursor=pointer]:
              - /url: /services
        - generic [ref=e111]:
          - heading "Track a shipment" [level=2] [ref=e112]
          - paragraph [ref=e113]: Enter the tracking number from your shipping confirmation.
          - generic [ref=e114]:
            - generic [ref=e115]: Tracking number
            - generic [ref=e116]:
              - textbox "STX9 8475 6532 US" [ref=e118]
              - button "Track Shipment" [ref=e119]
          - paragraph [ref=e123]: Tracking numbers look like STX9 8475 6532 US. Spaces, dashes and lower case are all fine, we normalise them for you.
      - region "Quick actions" [ref=e124]:
        - list [ref=e126]:
          - listitem [ref=e127]:
            - link "Track Find a shipment by its number" [ref=e128] [cursor=pointer]:
              - /url: /track
              - generic [ref=e133]:
                - generic [ref=e134]: Track
                - generic [ref=e137]: Find a shipment by its number
          - listitem [ref=e138]:
            - link "Ship Book a collection from Dubai" [ref=e139] [cursor=pointer]:
              - /url: /ship
              - generic [ref=e144]:
                - generic [ref=e145]: Ship
                - generic [ref=e148]: Book a collection from Dubai
          - listitem [ref=e149]:
            - link "Services Compare delivery speeds" [ref=e150] [cursor=pointer]:
              - /url: /services
              - generic [ref=e157]:
                - generic [ref=e158]: Services
                - generic [ref=e161]: Compare delivery speeds
          - listitem [ref=e162]:
            - link "Support Understand a status" [ref=e163] [cursor=pointer]:
              - /url: /support
              - generic [ref=e168]:
                - generic [ref=e169]: Support
                - generic [ref=e172]: Understand a status
      - generic [ref=e174]:
        - generic [ref=e175]:
          - paragraph [ref=e176]: Why SwiftTrack
          - heading "Built for shipments that actually matter" [level=2] [ref=e177]
          - paragraph [ref=e178]: A smaller, private network with fewer handoffs and a clearer record of what happened to your package.
        - generic [ref=e179]:
          - generic [ref=e180]:
            - heading "Private by default" [level=3] [ref=e185]
            - paragraph [ref=e186]: Shipment contents, addresses and contact details stay with the people who need them. Public tracking shows the route and the scans, never the personal details behind them.
          - generic [ref=e187]:
            - heading "A tracking record you can check" [level=3] [ref=e193]
            - paragraph [ref=e194]: Every scan is timestamped and placed. When an estimate changes, the reason appears on the timeline instead of the date quietly moving.
          - generic [ref=e195]:
            - heading "Handled through one gateway" [level=3] [ref=e202]
            - paragraph [ref=e203]: Collection, export handling and linehaul all run through our own Dubai facility, so a shipment does not change hands between companies before it has even left the country.
          - generic [ref=e204]:
            - heading "Support that can see the shipment" [level=3] [ref=e209]
            - paragraph [ref=e210]: Our team works from the same operational record you see, plus the internal notes, so you get an answer rather than a status page read back to you.
      - generic [ref=e212]:
        - generic [ref=e213]:
          - paragraph [ref=e214]: How it works
          - heading "Four stages, each one scanned" [level=2] [ref=e215]
          - paragraph [ref=e216]: Nothing appears on your tracking page until it has actually happened.
        - list [ref=e217]:
          - listitem [ref=e218]:
            - generic [ref=e219]:
              - text: "01"
              - heading "Booked and labelled" [level=3] [ref=e220]
              - paragraph [ref=e221]: We create the shipment, generate a tracking number and schedule the pickup window.
          - listitem [ref=e222]:
            - generic [ref=e223]:
              - text: "02"
              - heading "Collected" [level=3] [ref=e224]
              - paragraph [ref=e225]: A SwiftTrack courier collects the shipment and records the first scan at the Dubai gateway.
          - listitem [ref=e226]:
            - generic [ref=e227]:
              - text: "03"
              - heading "Cleared and flown" [level=3] [ref=e228]
              - paragraph [ref=e229]: Export documentation is presented, the shipment departs on linehaul, and it is scanned again on arrival in the destination country.
          - listitem [ref=e230]:
            - generic [ref=e231]:
              - text: "04"
              - heading "Delivered" [level=3] [ref=e232]
              - paragraph [ref=e233]: The final courier completes delivery and the shipment is closed with a delivery scan.
      - generic [ref=e235]:
        - generic [ref=e236]:
          - paragraph [ref=e237]: Our record
          - heading "Numbers from our own database, not a brochure" [level=2] [ref=e238]
          - paragraph [ref=e239]: Computed live from completed shipments and customer ratings each time this page is served. When there is not enough data behind a figure, we say so instead of publishing one.
        - generic [ref=e241]:
          - generic [ref=e243]:
            - paragraph [ref=e244]: Deliveries completed
            - paragraph [ref=e245]: "128"
            - paragraph [ref=e246]: Shipments delivered and closed.
          - generic [ref=e248]:
            - paragraph [ref=e249]: Delivered on time
            - paragraph [ref=e250]:
              - generic [ref=e251]: 97.7%
            - paragraph [ref=e252]: Delivered on or before the estimated date, across shipments that carried an estimate.
          - generic [ref=e254]:
            - paragraph [ref=e255]: Average transit
            - paragraph [ref=e256]: 4.2days
            - paragraph [ref=e257]: Days from pickup scan to delivery scan.
          - generic [ref=e259]:
            - paragraph [ref=e260]: Customer rating
            - paragraph [ref=e261]:
              - generic [ref=e262]: "4.8"
            - paragraph [ref=e275]: From 41 rated deliveries.
      - generic [ref=e277]:
        - generic [ref=e278]:
          - generic [ref=e279]:
            - paragraph [ref=e280]: Worth reading
            - heading "Shipping well is mostly knowing what matters" [level=2] [ref=e281]
            - paragraph [ref=e282]: Three things our operations team explains most often.
          - link "Read the help centre" [ref=e283] [cursor=pointer]:
            - /url: /help
        - generic [ref=e286]:
          - link "Sending something What to get right before we knock Packaging, declared value and customs paperwork decide whether a shipment sails through a border or sits at it. Four things worth ten minutes. How to prepare a shipment" [ref=e288] [cursor=pointer]:
            - /url: /ship
            - generic [ref=e289]: Sending something
            - generic [ref=e317]:
              - heading "What to get right before we knock" [level=3] [ref=e318]
              - paragraph [ref=e319]: Packaging, declared value and customs paperwork decide whether a shipment sails through a border or sits at it. Four things worth ten minutes.
              - generic [ref=e320]: How to prepare a shipment
          - link "Crossing borders Five service levels, one tracking record Standard through to same day, plus managed freight. What changes is how fast it departs and how closely it is watched, never the quality of the record. Compare service levels" [ref=e324] [cursor=pointer]:
            - /url: /services
            - generic [ref=e325]: Crossing borders
            - generic [ref=e351]:
              - heading "Five service levels, one tracking record" [level=3] [ref=e352]
              - paragraph [ref=e353]: Standard through to same day, plus managed freight. What changes is how fast it departs and how closely it is watched, never the quality of the record.
              - generic [ref=e354]: Compare service levels
          - link "Shipping regularly Accounts built around your lanes Scheduled collections, customs documentation prepared in advance, and an operations contact who knows which of your shipments cannot slip. See business solutions" [ref=e358] [cursor=pointer]:
            - /url: /business
            - generic [ref=e359]: Shipping regularly
            - generic [ref=e413]:
              - heading "Accounts built around your lanes" [level=3] [ref=e414]
              - paragraph [ref=e415]: Scheduled collections, customs documentation prepared in advance, and an operations contact who knows which of your shipments cannot slip.
              - generic [ref=e416]: See business solutions
      - generic [ref=e420]:
        - generic [ref=e421]:
          - generic [ref=e422]:
            - paragraph [ref=e423]: Services
            - heading "Choose the level of urgency" [level=2] [ref=e424]
            - paragraph [ref=e425]: Every service level uses the same network and the same tracking record.
          - link "All services" [ref=e426] [cursor=pointer]:
            - /url: /services
        - generic [ref=e429]:
          - generic [ref=e430]:
            - heading "Parcel delivery" [level=3] [ref=e435]
            - paragraph [ref=e436]: Standard and express handling for boxes, envelopes and padded parcels.
          - generic [ref=e437]:
            - heading "Priority and same day" [level=3] [ref=e442]
            - paragraph [ref=e443]: Time critical movements within a metro area or between nearby regions.
          - generic [ref=e444]:
            - heading "Managed freight" [level=3] [ref=e449]
            - paragraph [ref=e450]: Larger consignments handled as a single tracked shipment with a scheduled delivery appointment.
      - generic [ref=e454]:
        - generic [ref=e455]:
          - heading "A shipment that needs attention?" [level=2] [ref=e456]
          - paragraph [ref=e457]: Our support team can look into a shipment that has stalled, been marked delayed, or needs a delivery change. They work from the same operational record you see, plus the internal notes. Have the tracking number ready.
          - paragraph [ref=e458]: Sunday to Thursday, 8:00 AM to 8:00 PM GST
        - generic [ref=e459]:
          - link "Contact support" [ref=e460] [cursor=pointer]:
            - /url: /contact
          - link "Tracking help" [ref=e461] [cursor=pointer]:
            - /url: /support
    - contentinfo [ref=e462]:
      - generic [ref=e463]:
        - generic [ref=e464]:
          - generic [ref=e465]:
            - generic [ref=e483]:
              - generic [ref=e484]: SwiftTrack
              - generic [ref=e485]: PRIVATE DELIVERY COMPANY
            - paragraph [ref=e486]: A private delivery company for shipments that need careful handling and a tracking record you can rely on.
            - generic [ref=e487]:
              - link "support@swifttrack.example" [ref=e488] [cursor=pointer]:
                - /url: mailto:support@swifttrack.example
              - link "+971 4 555 0142" [ref=e492] [cursor=pointer]:
                - /url: tel:+97145550142
              - generic [ref=e495]: United Arab Emirates desk - Sunday to Thursday, 8:00 AM to 8:00 PM GST
          - navigation "Shipping" [ref=e496]:
            - heading "Shipping" [level=2] [ref=e497]
            - list [ref=e498]:
              - listitem [ref=e499]:
                - link "Track a shipment" [ref=e500] [cursor=pointer]:
                  - /url: /track
              - listitem [ref=e501]:
                - link "Send a shipment" [ref=e502] [cursor=pointer]:
                  - /url: /ship
              - listitem [ref=e503]:
                - link "Delivery services" [ref=e504] [cursor=pointer]:
                  - /url: /services
              - listitem [ref=e505]:
                - link "Business solutions" [ref=e506] [cursor=pointer]:
                  - /url: /business
          - navigation "Company" [ref=e507]:
            - heading "Company" [level=2] [ref=e508]
            - list [ref=e509]:
              - listitem [ref=e510]:
                - link "About SwiftTrack" [ref=e511] [cursor=pointer]:
                  - /url: /about
              - listitem [ref=e512]:
                - link "Support centre" [ref=e513] [cursor=pointer]:
                  - /url: /support
              - listitem [ref=e514]:
                - link "Help and FAQ" [ref=e515] [cursor=pointer]:
                  - /url: /help
              - listitem [ref=e516]:
                - link "Contact us" [ref=e517] [cursor=pointer]:
                  - /url: /contact
          - navigation "Legal" [ref=e518]:
            - heading "Legal" [level=2] [ref=e519]
            - list [ref=e520]:
              - listitem [ref=e521]:
                - link "Privacy Policy" [ref=e522] [cursor=pointer]:
                  - /url: /legal/privacy
              - listitem [ref=e523]:
                - link "Terms of Service" [ref=e524] [cursor=pointer]:
                  - /url: /legal/terms
        - generic [ref=e525]:
          - paragraph [ref=e526]: © 2026 SwiftTrack Private Delivery Company. All rights reserved.
          - generic [ref=e527]: Jebel Ali Free Zone, Building A4, Dubai, United Arab Emirates
        - paragraph [ref=e528]: SwiftTrack is an independent private delivery company. It is not affiliated with, endorsed by, or acting on behalf of USPS, UPS, FedEx, DHL, any government agency, or any law enforcement body.
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
  61 |     await input.fill("junk");
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
> 75 |     await page.getByTestId("tracking-input").first().fill(TRACKING_IN_TRANSIT);
     |                                                      ^ Error: locator.fill: Test timeout of 30000ms exceeded.
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