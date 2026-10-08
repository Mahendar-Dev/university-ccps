module canteen {
    requires javafx.controls;
    requires javafx.graphics;
    requires javafx.base;

    opens canteen to javafx.graphics, javafx.fxml;

    exports canteen;
}