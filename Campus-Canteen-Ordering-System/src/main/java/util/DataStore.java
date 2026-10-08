package util;

import canteen.User;
import canteen.MenuItem;
import canteen.Order;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.Queue;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

class BSTNode {
    MenuItem item;
    BSTNode left, right;

    public BSTNode(MenuItem item) {
        this.item = item;
        this.left = this.right = null;
    }
}

public class DataStore {

    private static final List<User> userArray = new ArrayList<>();
    
    private static final Queue<Order> pendingOrderQueue = new LinkedList<>();

    private static final List<MenuItem> inventoryLinkedList = new LinkedList<>();

    private static BSTNode menuBST = null;

    private static final Map<Integer, List<Integer>> userOrderGraph = new HashMap<>();
    private static final Map<Integer, Order> orderMap = new HashMap<>();

    private static int nextUserId = 1;
    private static int nextOrderId = 1001;
    private static int nextItemId = 101;


    static {
        addUser(new User(nextUserId++, "mahendardev", "admin1", "ADMIN"));
        addUser(new User(nextUserId++, "abdulrafay", "student1", "STUDENT"));
        addUser(new User(nextUserId++, "farzainali", "student2", "STUDENT"));
        
        MenuItem burger = new MenuItem(nextItemId++, "Classic Burger", 5.99, 50);
        MenuItem fries = new MenuItem(nextItemId++, "French Fries", 2.99, 100);
        MenuItem soda = new MenuItem(nextItemId++, "Cola Soda", 1.50, 75);
        MenuItem salad = new MenuItem(nextItemId++, "Garden Salad", 4.50, 40);

        addToInventory(burger); addToInventory(fries);
        addToInventory(soda); addToInventory(salad);

        insertIntoBST(burger); insertIntoBST(fries);
        insertIntoBST(soda); insertIntoBST(salad);
    }
    
    public static void addUser(User user) {
        userArray.add(user);
    }
    
    public static Optional<User> findUser(String username, String password) {
        return userArray.stream()
                        .filter(u -> u.getUsername().equals(username) && u.getPassword().equals(password))
                        .findFirst();
    }
    
    public static void placeNewOrder(int userId, List<MenuItem> items) {
        Order newOrder = new Order(nextOrderId++, userId, items);
        pendingOrderQueue.offer(newOrder);
        orderMap.put(newOrder.getOrderId(), newOrder);
        
        userOrderGraph.computeIfAbsent(userId, k -> new ArrayList<>()).add(newOrder.getOrderId());
    }

    public static Optional<Order> dequeueNextOrder() {
        return Optional.ofNullable(pendingOrderQueue.poll());
    }

    public static Queue<Order> getPendingOrders() {
        return pendingOrderQueue;
    }
    
    public static void addToInventory(MenuItem item) {
        inventoryLinkedList.add(item);
    }

    public static Optional<MenuItem> findItemByName(String name) {
        return inventoryLinkedList.stream()
                                  .filter(i -> i.getName().equalsIgnoreCase(name))
                                  .findFirst();
    }

    public static List<MenuItem> getInventoryList() {
        return inventoryLinkedList;
    }

    private static BSTNode insert(BSTNode root, MenuItem item) {
        if (root == null) {
            return new BSTNode(item);
        }
        if (item.getItemId() < root.item.getItemId()) {
            root.left = insert(root.left, item);
        } else if (item.getItemId() > root.item.getItemId()) {
            root.right = insert(root.right, item);
        }
        return root;
    }

    public static void insertIntoBST(MenuItem item) {
        menuBST = insert(menuBST, item);
    }

    public static List<MenuItem> getMenuItemsSorted() {
        List<MenuItem> sortedItems = new ArrayList<>();
        inOrderTraversal(menuBST, sortedItems);
        return sortedItems;
    }

    private static void inOrderTraversal(BSTNode node, List<MenuItem> list) {
        if (node != null) {
            inOrderTraversal(node.left, list);
            list.add(node.item);
            inOrderTraversal(node.right, list);
        }
    }
    
    public static List<Order> getUserOrderHistory(int userId) {
        List<Order> history = new ArrayList<>();
        List<Integer> orderIds = userOrderGraph.getOrDefault(userId, new ArrayList<>());
        
        for (Integer orderId : orderIds) {
            Order order = orderMap.get(orderId);
            if (order != null) {
                history.add(order);
            }
        }
        return history;
    }
}