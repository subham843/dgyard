// CSV Export Utility Functions

export function exportToCSV(data: any[], filename: string, headers: string[]) {
  const csvHeaders = headers.join(",");
  const csvRows = data.map((row) => {
    return headers.map((header) => {
      const value = row[header.toLowerCase().replace(/\s+/g, "_")] || row[header] || "";
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === "string" && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(",");
  });

  const csvContent = [csvHeaders, ...csvRows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportOrdersToCSV(orders: any[]) {
  const headers = ["Order Number", "Customer", "Email", "Date", "Items", "Amount", "Status", "Payment Status"];
  const data = orders.map((order) => ({
    order_number: order.orderNumber,
    customer: order.user?.name || "N/A",
    email: order.user?.email || "N/A",
    date: new Date(order.createdAt).toLocaleDateString("en-IN"),
    items: order.items?.length || 0,
    amount: `₹${order.total?.toLocaleString("en-IN")}`,
    status: order.status,
    payment_status: order.paymentStatus,
  }));
  exportToCSV(data, "orders", headers);
}

export function exportCustomersToCSV(customers: any[]) {
  const headers = ["Name", "Email", "Phone", "Total Orders", "Total Spent", "Last Order Date"];
  const data = customers.map((customer) => ({
    name: customer.name || "N/A",
    email: customer.email || "N/A",
    phone: customer.phone || "N/A",
    total_orders: customer.totalOrders || 0,
    total_spent: `₹${customer.totalSpent?.toLocaleString("en-IN")}`,
    last_order_date: customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString("en-IN") : "N/A",
  }));
  exportToCSV(data, "customers", headers);
}

export function exportInventoryToCSV(products: any[]) {
  const headers = ["Product Name", "SKU", "Stock", "Price", "Stock Value", "Status"];
  const data = products.map((product) => ({
    product_name: product.name,
    sku: product.sku || "N/A",
    stock: product.stock || 0,
    price: `₹${product.price?.toLocaleString("en-IN")}`,
    stock_value: `₹${(product.price * product.stock).toLocaleString("en-IN")}`,
    status: product.stock === 0 ? "Out of Stock" : product.stock <= 10 ? "Low Stock" : "In Stock",
  }));
  exportToCSV(data, "inventory", headers);
}

export function exportPaymentsToCSV(payments: any[]) {
  const headers = ["Order Number", "Date", "Order Amount", "Commission", "Net Payable", "Status", "Settlement Date"];
  const data = payments.map((payment) => ({
    order_number: payment.orderNumber,
    date: new Date(payment.orderDate).toLocaleDateString("en-IN"),
    order_amount: `₹${payment.amount?.toLocaleString("en-IN")}`,
    commission: `₹${payment.commission?.toLocaleString("en-IN")}`,
    net_payable: `₹${payment.netAmount?.toLocaleString("en-IN")}`,
    status: payment.status,
    settlement_date: payment.settlementDate ? new Date(payment.settlementDate).toLocaleDateString("en-IN") : "Pending",
  }));
  exportToCSV(data, "payments", headers);
}





