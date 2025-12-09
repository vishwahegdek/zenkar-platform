# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - link "Order Book" [ref=e7] [cursor=pointer]:
          - /url: /
        - navigation [ref=e8]:
          - link "Orders" [ref=e9] [cursor=pointer]:
            - /url: /orders
          - link "Customers" [ref=e10] [cursor=pointer]:
            - /url: /customers
          - link "Products" [ref=e11] [cursor=pointer]:
            - /url: /products
      - link "New Order" [ref=e13] [cursor=pointer]:
        - /url: /orders/new
        - generic [ref=e14]: New Order
  - main [ref=e15]:
    - generic [ref=e16]:
      - generic [ref=e17]:
        - heading "Customers" [level=1] [ref=e18]
        - generic [ref=e19]:
          - textbox "Search customers..." [active] [ref=e20]: Test Customer 1765298225802
          - link "+ New Customer" [ref=e21] [cursor=pointer]:
            - /url: /customers/new
      - generic [ref=e24]:
        - generic [ref=e25]:
          - heading "Test Customer 1765298225802" [level=3] [ref=e26]
          - paragraph [ref=e27]: "9876543210"
          - paragraph [ref=e28]: 123 Test St, Test City
        - link "Edit ✏️" [ref=e30] [cursor=pointer]:
          - /url: /customers/25/edit
          - generic [ref=e31]: Edit
          - text: ✏️
```