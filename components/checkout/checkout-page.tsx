"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";
import { MapPin, Plus, Trash2, CreditCard, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export function CheckoutPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  useEffect(() => {
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    fetchCart();
    fetchAddresses();
  }, [session]);

  const fetchCart = async () => {
    try {
      const response = await fetch("/api/cart");
      const data = await response.json();
      setCartItems(data.items || []);
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await fetch("/api/addresses");
      const data = await response.json();
      setAddresses(data.addresses || []);
      if (data.addresses?.length > 0) {
        const defaultAddr = data.addresses.find((a: any) => a.isDefault) || data.addresses[0];
        setSelectedAddress(defaultAddr.id);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  const handleSaveAddress = async () => {
    try {
      const response = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        toast.success("Address saved");
        setShowNewAddress(false);
        fetchAddresses();
        setFormData({
          name: "",
          phone: "",
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
        });
      }
    } catch (error) {
      toast.error("Failed to save address");
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select or add an address");
      return;
    }

    setLoading(true);
    try {
      const subtotal = cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );
      const tax = subtotal * 0.18;
      const shipping = subtotal > 5000 ? 0 : 99;
      const total = subtotal + tax + shipping;

      // Create order first
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddress,
          items: cartItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
          })),
          subtotal,
          tax,
          shipping,
          total,
        }),
      });

      const orderData = await orderResponse.json();
      if (!orderResponse.ok) {
        toast.error(orderData.error || "Failed to place order");
        setLoading(false);
        return;
      }

      // Create Razorpay order
      const paymentResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderData.order.id,
          amount: total,
        }),
      });

      const paymentData = await paymentResponse.json();
      if (!paymentResponse.ok) {
        toast.error(paymentData.error || "Failed to initialize payment");
        setLoading(false);
        return;
      }

      // Initialize Razorpay checkout
      const options = {
        key: paymentData.key,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: paymentData.name,
        description: paymentData.description,
        order_id: paymentData.orderId,
        prefill: paymentData.prefill,
        theme: paymentData.theme,
        handler: async function (response: any) {
          // Verify payment
          const verifyResponse = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderData.order.id,
            }),
          });

          const verifyData = await verifyResponse.json();
          if (verifyResponse.ok) {
            router.push(`/payments/success?orderId=${orderData.order.id}`);
          } else {
            router.push(`/payments/failure?orderId=${orderData.order.id}&error=${encodeURIComponent(verifyData.error || "Payment verification failed")}`);
          }
        },
        modal: {
          ondismiss: function() {
            toast.error("Payment cancelled");
            setLoading(false);
          },
        },
      };

      // Load Razorpay script dynamically
      if ((window as any).Razorpay) {
        // Script already loaded
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        setLoading(false);
      } else {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => {
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
          setLoading(false);
        };
        script.onerror = () => {
          toast.error("Failed to load payment gateway");
          setLoading(false);
        };
        document.body.appendChild(script);
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Something went wrong");
      setLoading(false);
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const tax = subtotal * 0.18;
  const shipping = subtotal > 5000 ? 0 : 99;
  const total = subtotal + tax + shipping;

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <Button asChild>
            <a href="/shop">Browse Products</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Address Selection */}
          <div className="bg-white rounded-lg p-6 border border-lavender-light">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Delivery Address
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewAddress(!showNewAddress)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New
              </Button>
            </div>

            {showNewAddress && (
              <div className="mb-6 p-4 bg-lavender-light rounded-lg space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Address Line 1</Label>
                  <Input
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Address Line 2 (Optional)</Label>
                  <Input
                    value={formData.addressLine2}
                    onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Pincode</Label>
                    <Input
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleSaveAddress}>Save Address</Button>
              </div>
            )}

            <div className="space-y-3">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={`block p-4 border-2 rounded-lg cursor-pointer ${
                    selectedAddress === address.id
                      ? "border-primary-blue bg-primary-blue/10"
                      : "border-lavender-light"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    value={address.id}
                    checked={selectedAddress === address.id}
                    onChange={(e) => setSelectedAddress(e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-semibold">{address.name}</div>
                    <div className="text-sm text-light-gray">{address.phone}</div>
                    <div className="text-sm text-light-gray">
                      {address.addressLine1}, {address.addressLine2 && `${address.addressLine2}, `}
                      {address.city}, {address.state} - {address.pincode}
                    </div>
                    {address.isDefault && (
                      <span className="text-xs text-blue-600 font-medium">Default</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg p-6 border border-lavender-light">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Method
            </h2>
            <div className="p-4 border-2 border-primary-blue rounded-lg bg-primary-blue/10">
              <div className="font-semibold text-dark-blue">Razorpay</div>
              <div className="text-sm text-light-gray">Pay securely with Razorpay</div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg p-6 border border-gray-200 sticky top-4">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-light-gray">
                    {item.product.name} x {item.quantity}
                  </span>
                  <span>{formatPrice(item.product.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (GST 18%)</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <Button
              className="w-full mt-6"
              size="lg"
              onClick={handlePlaceOrder}
              disabled={loading}
              style={{ backgroundColor: '#3A59FF' }}
            >
              Place Order
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

