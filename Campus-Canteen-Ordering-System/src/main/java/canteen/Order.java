package canteen;

import java.util.List;
import java.util.Date;

public class Order {
    private final int orderId;
    private final int userId;
    private final Date timestamp;
    private final List<MenuItem> items;
    private boolean isCompleted;

    public Order(int orderId, int userId, List<MenuItem> items) {
        this.orderId = orderId;
        this.userId = userId;
        this.items = items;
        this.timestamp = new Date();
        this.isCompleted = false;
    }

    public int getOrderId() { return orderId; }
    public int getUserId() { return userId; }
    public Date getTimestamp() { return timestamp; }
    public List<MenuItem> getItems() { return items; }
    public boolean isCompleted() { return isCompleted; }

    public void setCompleted(boolean completed) {
        isCompleted = completed;
    }

    public double calculateTotal() {
        return items.stream().mapToDouble(MenuItem::getPrice).sum();
    }

    @Override
    public String toString() {
        return String.format("Order #%d (User: %d, Items: %d, Total: %.2f)", 
                             orderId, userId, items.size(), calculateTotal());
    }
}