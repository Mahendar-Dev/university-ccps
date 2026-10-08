package canteen;

import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.SimpleDoubleProperty;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.property.StringProperty; // Import these for return types
import javafx.beans.property.DoubleProperty;
import javafx.beans.property.IntegerProperty;

public class MenuItem {
    private final SimpleStringProperty name;
    private final SimpleDoubleProperty price;
    private final SimpleIntegerProperty stock;
    private final int itemId;

    public MenuItem(int itemId, String name, double price, int stock) {
        this.itemId = itemId;
        this.name = new SimpleStringProperty(name);
        this.price = new SimpleDoubleProperty(price);
        this.stock = new SimpleIntegerProperty(stock);
    }

    public String getName() { return name.get(); }
    public double getPrice() { return price.get(); }
    public int getStock() { return stock.get(); }
    public int getItemId() { return itemId; }

    public StringProperty nameProperty() {
        return name;
    }

    public DoubleProperty priceProperty() {
        return price;
    }

    public IntegerProperty stockProperty() {
        return stock;
    }

    public void setStock(int newStock) {
        this.stock.set(newStock);
    }
}