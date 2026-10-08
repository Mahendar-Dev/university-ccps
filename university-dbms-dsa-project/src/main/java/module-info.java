module university {
    requires javafx.controls;
    requires javafx.graphics;
    requires javafx.base;

    opens university to javafx.graphics, javafx.fxml;

    exports university;
}
