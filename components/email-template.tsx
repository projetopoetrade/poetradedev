import type { Order } from "@/types";
import * as React from "react";

interface EmailTemplateProps {
  order: Order;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  order,
}) => (
  <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
    <h1 style={{ color: '#4F46E5', marginBottom: '20px' }}>Hi, {order.character_name}! 👋</h1>
    
    <div style={{ backgroundColor: '#F3F4F6', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
      <h2 style={{ color: '#1F2937', marginBottom: '15px' }}>Order Confirmation</h2>
      <p style={{ marginBottom: '10px' }}>
        <strong>Order ID:</strong> {order.id}
      </p>
      <p style={{ marginBottom: '10px' }}>
        <strong>Order Date:</strong> {new Date(order.created_at).toLocaleDateString()}
      </p>
      <p style={{ marginBottom: '10px' }}>
        <strong>Status:</strong> <span style={{ color: '#059669', fontWeight: 'bold' }}>Payment Approved ✓</span>
      </p>
    </div>

    <div style={{ marginBottom: '20px' }}>
      <h2 style={{ color: '#1F2937', marginBottom: '15px' }}>Order Items</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#F3F4F6' }}>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #E5E7EB' }}>Item</th>
            <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #E5E7EB' }}>Quantity</th>
            <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #E5E7EB' }}>Price</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #E5E7EB' }}>
              <td style={{ padding: '10px' }}>{item.product.name}</td>
              <td style={{ padding: '10px', textAlign: 'right' }}>{item.quantity}</td>
              <td style={{ padding: '10px', textAlign: 'right' }}>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: order.currency
                }).format(item.product.price * item.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ backgroundColor: '#F3F4F6' }}>
            <td colSpan={2} style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Total:</td>
            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: order.currency
              }).format(order.total_amount)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div style={{ backgroundColor: '#F3F4F6', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
      <h2 style={{ color: '#1F2937', marginBottom: '15px' }}>Delivery Instructions</h2>
      <p style={{ margin: '0', color: '#4B5563' }}>
        Our trader will contact you in-game with the message: "TFT item or something else". When you receive the trade request, <strong>IMPORTANT: PUT A RANDOM RARE ITEM IN THE TRADE WINDOW</strong>. This is a required security step. After confirming the items, complete the trade to receive your purchased items.
      </p>
    </div>

    <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#EEF2FF', borderRadius: '8px' }}>
      <p style={{ margin: '0', color: '#4F46E5' }}>
        If you have any questions or need assistance, please contact our support team through the website.
      </p>
    </div>
  </div>
);
