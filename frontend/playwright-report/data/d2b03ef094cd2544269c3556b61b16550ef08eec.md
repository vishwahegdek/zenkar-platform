# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - link "Order Book" [ref=e7] [cursor=pointer]:
        - /url: /
      - generic [ref=e8]:
        - link "New Order" [ref=e9] [cursor=pointer]:
          - /url: /orders/new
          - generic [ref=e10]: New
        - button "Open menu" [ref=e11]: ☰
  - main [ref=e12]:
    - generic [ref=e13]:
      - generic [ref=e14]:
        - heading "Customers" [level=1] [ref=e15]
        - textbox "Search customers..." [active] [ref=e17]: Test Customer 1765298225861
      - generic [ref=e20]:
        - generic [ref=e21]:
          - heading "Test Customer 1765298225861" [level=3] [ref=e22]
          - paragraph [ref=e23]: "9876543210"
          - paragraph [ref=e24]: 123 Test St, Test City
        - link "Edit ✏️" [ref=e26] [cursor=pointer]:
          - /url: /customers/24/edit
          - generic [ref=e27]: Edit
          - text: ✏️
      - link "+" [ref=e28] [cursor=pointer]:
        - /url: /customers/new
```