# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accessibility.spec.ts >> keyboard access >> the tracking field is reachable and submittable from the keyboard
- Location: tests/e2e/accessibility.spec.ts:39:7

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator: getByTestId('tracking-input')
Expected: focused
Error: TypeError: text.replace is not a function
    at quoteCSSAttributeValue (<anonymous>:1918:19)
    at makeSelectorForId (<anonymous>:6098:68)
    at cssFallback (<anonymous>:6128:21)
    at generateSelectorFor (<anonymous>:5964:121)
    at generateSelector (<anonymous>:5891:30)
    at InjectedScript.generateSelectorSimple (<anonymous>:6859:12)
    at <anonymous>:7732:24
    at Array.map (<anonymous>)
    at InjectedScript._generateSelectors (<anonymous>:7730:52)
    at InjectedScript.strictModeViolationError (<anonymous>:7742:24)

Call log:
  - Expect "toBeFocused" with timeout 5000ms
  - waiting for getByTestId('tracking-input')

```

# Page snapshot

```yaml
- generic [ref=e1]:
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
      - generic [ref=e70]:
        - heading "Track a shipment" [level=1] [ref=e71]
        - paragraph [ref=e72]: Enter the tracking number from your shipping confirmation. It starts with ST and is twelve characters long.
        - generic [ref=e74]:
          - generic [ref=e75]: Tracking number
          - generic [ref=e76]:
            - textbox "STX9 8475 6532 US" [active] [ref=e78]
            - button "Track Shipment" [ref=e79]
        - generic [ref=e83]:
          - generic [ref=e84]:
            - paragraph [ref=e89]: No updates yet?
            - paragraph [ref=e90]: A tracking number becomes active once the package receives its first scan in our network.
          - generic [ref=e91]:
            - paragraph [ref=e96]: Scan locations
            - paragraph [ref=e97]: Each entry shows where the package was scanned. SwiftTrack does not publish live GPS.
          - generic [ref=e98]:
            - paragraph [ref=e103]: Need a person?
            - paragraph [ref=e104]: Our support team can look into a shipment that has not moved as expected.
    - contentinfo [ref=e105]:
      - generic [ref=e106]:
        - generic [ref=e107]:
          - generic [ref=e108]:
            - generic [ref=e126]:
              - generic [ref=e127]: SwiftTrack
              - generic [ref=e128]: PRIVATE DELIVERY COMPANY
            - paragraph [ref=e129]: A private delivery company for shipments that need careful handling and a tracking record you can rely on.
            - generic [ref=e130]:
              - link "support@swifttrack.example" [ref=e131] [cursor=pointer]:
                - /url: mailto:support@swifttrack.example
              - link "+971 4 555 0142" [ref=e135] [cursor=pointer]:
                - /url: tel:+97145550142
              - generic [ref=e138]: United Arab Emirates desk - Sunday to Thursday, 8:00 AM to 8:00 PM GST
          - navigation "Shipping" [ref=e139]:
            - heading "Shipping" [level=2] [ref=e140]
            - list [ref=e141]:
              - listitem [ref=e142]:
                - link "Track a shipment" [ref=e143] [cursor=pointer]:
                  - /url: /track
              - listitem [ref=e144]:
                - link "Send a shipment" [ref=e145] [cursor=pointer]:
                  - /url: /ship
              - listitem [ref=e146]:
                - link "Delivery services" [ref=e147] [cursor=pointer]:
                  - /url: /services
              - listitem [ref=e148]:
                - link "Business solutions" [ref=e149] [cursor=pointer]:
                  - /url: /business
          - navigation "Company" [ref=e150]:
            - heading "Company" [level=2] [ref=e151]
            - list [ref=e152]:
              - listitem [ref=e153]:
                - link "About SwiftTrack" [ref=e154] [cursor=pointer]:
                  - /url: /about
              - listitem [ref=e155]:
                - link "Support centre" [ref=e156] [cursor=pointer]:
                  - /url: /support
              - listitem [ref=e157]:
                - link "Help and FAQ" [ref=e158] [cursor=pointer]:
                  - /url: /help
              - listitem [ref=e159]:
                - link "Contact us" [ref=e160] [cursor=pointer]:
                  - /url: /contact
          - navigation "Legal" [ref=e161]:
            - heading "Legal" [level=2] [ref=e162]
            - list [ref=e163]:
              - listitem [ref=e164]:
                - link "Privacy Policy" [ref=e165] [cursor=pointer]:
                  - /url: /legal/privacy
              - listitem [ref=e166]:
                - link "Terms of Service" [ref=e167] [cursor=pointer]:
                  - /url: /legal/terms
        - generic [ref=e168]:
          - paragraph [ref=e169]: © 2026 SwiftTrack Private Delivery Company. All rights reserved.
          - generic [ref=e170]: Jebel Ali Free Zone, Building A4, Dubai, United Arab Emirates
        - paragraph [ref=e171]: SwiftTrack is an independent private delivery company. It is not affiliated with, endorsed by, or acting on behalf of USPS, UPS, FedEx, DHL, any government agency, or any law enforcement body.
  - alert [ref=e172]
```