package canteen;

import canteen.MenuItem;
import canteen.Order;
import canteen.User;
import util.DataStore;

import javafx.application.Application;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.geometry.Insets;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.stage.Stage;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class MainApplication extends Application {

    private Stage primaryStage;
    private User currentUser;
    private final ObservableList<MenuItem> cartItems = FXCollections.observableArrayList();

    @Override
    public void start(Stage stage) {
        this.primaryStage = stage;
        primaryStage.setTitle("Campus Canteen Ordering System");
        showLoginScreen();
        primaryStage.show();
    }

    private void showLoginScreen() {
        GridPane grid = new GridPane();
        grid.setPadding(new Insets(20));
        grid.setVgap(10);
        grid.setHgap(10);

        TextField usernameField = new TextField();
        PasswordField passwordField = new PasswordField();
        Button loginButton = new Button("Login");

        grid.add(new Label("Username:"), 0, 0);
        grid.add(usernameField, 1, 0);
        grid.add(new Label("Password:"), 0, 1);
        grid.add(passwordField, 1, 1);
        grid.add(loginButton, 1, 2);

        loginButton.setOnAction(e -> {
            Optional<User> userOpt = DataStore.findUser(usernameField.getText(), passwordField.getText());
            if (userOpt.isPresent()) {
                currentUser = userOpt.get();
                if ("ADMIN".equals(currentUser.getRole())) {
                    showAdminView();
                } else {
                    showOrderScreen();
                }
            } else {
                showAlert(Alert.AlertType.ERROR, "Login Failed", "Invalid username or password.");
            }
        });

        Scene scene = new Scene(grid, 300, 150);
        primaryStage.setScene(scene);
    }

    private void showOrderScreen() {
        BorderPane root = new BorderPane();
        VBox menuBox = createMenuSection();
        VBox cartBox = createCartSection();

        SplitPane splitPane = new SplitPane(menuBox, cartBox);
        splitPane.setDividerPositions(0.6);

        root.setCenter(splitPane);
        root.setTop(createHeaderBar("Welcome, " + currentUser.getUsername() + " (STUDENT)"));

        Scene scene = new Scene(root, 900, 600);
        primaryStage.setScene(scene);
    }
    
    private void showAdminView() {
        BorderPane root = new BorderPane();
        
        TableView<Order> queueTable = createOrderQueueTable();
        
        Button processOrderButton = new Button("Process Next Order (Dequeue)");
        processOrderButton.setOnAction(e -> processNextOrder(queueTable));

        Button viewInventoryButton = new Button("View/Update Inventory (Linked List)");
        viewInventoryButton.setOnAction(e -> showInventoryView());

        VBox adminControls = new VBox(10, new Label("Pending Orders Queue (FIFO):"), queueTable, processOrderButton, new Separator(), viewInventoryButton);
        adminControls.setPadding(new Insets(10));
        
        root.setCenter(adminControls);
        root.setTop(createHeaderBar("Admin Panel"));

        Scene scene = new Scene(root, 700, 500);
        primaryStage.setScene(scene);
    }

    private HBox createHeaderBar(String title) {
        Label titleLabel = new Label(title);
        titleLabel.setStyle("-fx-font-size: 18px; -fx-font-weight: bold;");
        
        Button logoutButton = new Button("Logout");
        logoutButton.setOnAction(e -> {
            currentUser = null;
            showLoginScreen();
        });

        HBox header = new HBox(titleLabel, new Region(), logoutButton);
        HBox.setHgrow(header.getChildren().get(1), Priority.ALWAYS);
        header.setPadding(new Insets(10));
        header.setStyle("-fx-border-color: #ccc; -fx-border-width: 0 0 1 0;");
        return header;
    }
    
    private VBox createMenuSection() {
        Label title = new Label("Menu Items (BST Sorted)");
        title.setStyle("-fx-font-weight: bold;");
        
        TableView<MenuItem> menuTable = new TableView<>();
        TableColumn<MenuItem, String> nameCol = new TableColumn<>("Item");
        nameCol.setCellValueFactory(data -> data.getValue().nameProperty());
        TableColumn<MenuItem, Number> priceCol = new TableColumn<>("Price");
        priceCol.setCellValueFactory(data -> data.getValue().priceProperty());
        TableColumn<MenuItem, Number> stockCol = new TableColumn<>("Stock");
        stockCol.setCellValueFactory(data -> data.getValue().stockProperty());
        
        menuTable.getColumns().addAll(nameCol, priceCol, stockCol);
        
        menuTable.setItems(FXCollections.observableArrayList(DataStore.getMenuItemsSorted()));
        
        Button addToCartButton = new Button("Add to Cart");
        addToCartButton.setOnAction(e -> {
            MenuItem selectedItem = menuTable.getSelectionModel().getSelectedItem();
            if (selectedItem != null && selectedItem.getStock() > 0) {
                cartItems.add(selectedItem);
            } else if (selectedItem != null) {
                showAlert(Alert.AlertType.WARNING, "Out of Stock", selectedItem.getName() + " is currently out of stock.");
            }
        });
        
        VBox menuBox = new VBox(10, title, menuTable, addToCartButton);
        menuBox.setPadding(new Insets(10));
        return menuBox;
    }

    private VBox createCartSection() {
        Label title = new Label("Your Order Cart");
        title.setStyle("-fx-font-weight: bold;");

        TableView<MenuItem> cartTable = new TableView<>(cartItems);
        TableColumn<MenuItem, String> nameCol = new TableColumn<>("Item");
        nameCol.setCellValueFactory(data -> data.getValue().nameProperty());
        TableColumn<MenuItem, Number> priceCol = new TableColumn<>("Price");
        priceCol.setCellValueFactory(data -> data.getValue().priceProperty());
        cartTable.getColumns().addAll(nameCol, priceCol);
        
        Label totalLabel = new Label("Total: Rs: 0.00");
        cartItems.addListener((javafx.collections.ListChangeListener.Change<? extends MenuItem> c) -> {
            double total = cartItems.stream().mapToDouble(MenuItem::getPrice).sum();
            totalLabel.setText(String.format("Total: $%.2f", total));
        });

        Button placeOrderButton = new Button("Place Order (Enqueue)");
        placeOrderButton.setOnAction(e -> placeOrder());
        
        Button historyButton = new Button("View Order History (Graph Traversal)");
        historyButton.setOnAction(e -> showOrderHistory());

        VBox cartBox = new VBox(10, title, cartTable, totalLabel, placeOrderButton, historyButton);
        cartBox.setPadding(new Insets(10));
        return cartBox;
    }

    private TableView<Order> createOrderQueueTable() {
        TableView<Order> table = new TableView<>();
        TableColumn<Order, Integer> idCol = new TableColumn<>("Order ID");
        idCol.setCellValueFactory(data -> new javafx.beans.property.SimpleIntegerProperty(data.getValue().getOrderId()).asObject());
        
        TableColumn<Order, Integer> userCol = new TableColumn<>("User ID");
        userCol.setCellValueFactory(data -> new javafx.beans.property.SimpleIntegerProperty(data.getValue().getUserId()).asObject());
        
        TableColumn<Order, String> totalCol = new TableColumn<>("Total");
        totalCol.setCellValueFactory(data -> new javafx.beans.property.SimpleStringProperty(String.format("Rs: %.2f", data.getValue().calculateTotal())));

        TableColumn<Order, String> itemsCol = new TableColumn<>("Items");
        itemsCol.setCellValueFactory(data -> new javafx.beans.property.SimpleStringProperty(
                data.getValue().getItems().size() + " unique items"
        ));

        table.getColumns().addAll(idCol, userCol, itemsCol, totalCol);
        
        table.setItems(FXCollections.observableArrayList(DataStore.getPendingOrders()));
        
        return table;
    }
    
    private void placeOrder() {
        if (cartItems.isEmpty()) {
            showAlert(Alert.AlertType.WARNING, "Order Empty", "Your cart is empty. Add items before ordering.");
            return;
        }

        List<MenuItem> itemsToOrder = new ArrayList<>(cartItems);
        
        DataStore.placeNewOrder(currentUser.getId(), itemsToOrder);

        itemsToOrder.forEach(item -> {
            DataStore.findItemByName(item.getName()).ifPresent(masterItem -> {
                masterItem.setStock(masterItem.getStock() - 1);
            });
        });
        
        showAlert(Alert.AlertType.INFORMATION, "Order Placed", 
                  "Your order has been placed and is now in the queue! Total: Rs: " + 
                  String.format("%.2f", itemsToOrder.stream().mapToDouble(MenuItem::getPrice).sum()));

        cartItems.clear();
        showOrderScreen(); 
    }
    
    private void processNextOrder(TableView<Order> queueTable) {
        Optional<Order> nextOrder = DataStore.dequeueNextOrder();
        
        if (nextOrder.isPresent()) {
            Order order = nextOrder.get();
            order.setCompleted(true);
            showAlert(Alert.AlertType.INFORMATION, "Order Processed", 
                      String.format("Order #%d for User ID %d has been processed and removed from the queue.", 
                                    order.getOrderId(), order.getUserId()));
        } else {
            showAlert(Alert.AlertType.INFORMATION, "Queue Empty", "No pending orders to process.");
        }
        
        queueTable.setItems(FXCollections.observableArrayList(DataStore.getPendingOrders()));
    }
    
    private void showOrderHistory() {
        List<Order> history = DataStore.getUserOrderHistory(currentUser.getId());
        
        ListView<Order> historyList = new ListView<>();
        historyList.setItems(FXCollections.observableArrayList(history));
        historyList.setCellFactory(lv -> new ListCell<Order>() {
            @Override
            protected void updateItem(Order order, boolean empty) {
                super.updateItem(order, empty);
                if (empty || order == null) {
                    setText(null);
                } else {
                    String status = order.isCompleted() ? " (COMPLETED)" : " (PENDING)";
                    setText(String.format("Order #%d - Date: %s - Total: Rs: %.2f%s",
                            order.getOrderId(), 
                            new java.text.SimpleDateFormat("MMM dd, HH:mm").format(order.getTimestamp()),
                            order.calculateTotal(), status));
                }
            }
        });

        VBox layout = new VBox(10, new Label("Your Order History"), historyList);
        layout.setPadding(new Insets(10));
        
        Stage historyStage = new Stage();
        historyStage.setTitle("Order History & Invoice Map");
        historyStage.setScene(new Scene(layout, 500, 400));
        historyStage.initOwner(primaryStage);
        historyStage.show();
    }
    
    private void showInventoryView() {
        TableView<MenuItem> inventoryTable = new TableView<>();
        
        TableColumn<MenuItem, String> nameCol = new TableColumn<>("Item");
        nameCol.setCellValueFactory(data -> data.getValue().nameProperty());
        TableColumn<MenuItem, Number> priceCol = new TableColumn<>("Price");
        priceCol.setCellValueFactory(data -> data.getValue().priceProperty());
        TableColumn<MenuItem, Number> stockCol = new TableColumn<>("Stock");
        stockCol.setCellValueFactory(data -> data.getValue().stockProperty());
        
        inventoryTable.getColumns().addAll(nameCol, priceCol, stockCol);
        inventoryTable.setItems(FXCollections.observableArrayList(DataStore.getInventoryList()));

        Button closeButton = new Button("Close");
        
        VBox layout = new VBox(10, new Label("Inventory Management (Linked List)"), inventoryTable, closeButton);
        layout.setPadding(new Insets(10));
        
        Stage inventoryStage = new Stage();
        inventoryStage.setTitle("Inventory Management");
        inventoryStage.setScene(new Scene(layout, 500, 400));
        inventoryStage.initOwner(primaryStage);
        
        closeButton.setOnAction(e -> inventoryStage.close());
        inventoryStage.show();
    }


    private void showAlert(Alert.AlertType type, String title, String message) {
        Alert alert = new Alert(type);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }

    public static void main(String[] args) {
        launch(args);
    }
}