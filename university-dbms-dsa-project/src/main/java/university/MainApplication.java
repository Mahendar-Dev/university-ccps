package university;

import util.DataStore;

import javafx.application.Application;
import javafx.collections.FXCollections;
import javafx.geometry.Insets;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.stage.Stage;

import java.util.Optional;

public class MainApplication extends Application {

    private Stage primaryStage;
    private User currentUser;

    @Override
    public void start(Stage stage) {
        this.primaryStage = stage;
        primaryStage.setTitle("University Database Management System");
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
                    showStudentPortal();
                }
            } else {
                showAlert(Alert.AlertType.ERROR, "Login Failed", "Invalid username or password.");
            }
        });

        Scene scene = new Scene(grid, 320, 160);
        primaryStage.setScene(scene);
    }

    // ================= STUDENT PORTAL =================

    private void showStudentPortal() {
        BorderPane root = new BorderPane();
        VBox catalogBox = createCourseCatalogSection();

        root.setCenter(catalogBox);
        root.setTop(createHeaderBar("Welcome, " + currentUser.getUsername() + " (STUDENT)"));

        Scene scene = new Scene(root, 800, 550);
        primaryStage.setScene(scene);
    }

    private VBox createCourseCatalogSection() {
        Label title = new Label("Course Catalog (BST sorted by Course ID)");
        title.setStyle("-fx-font-weight: bold;");

        TableView<Course> catalogTable = new TableView<>();
        TableColumn<Course, String> codeCol = new TableColumn<>("Code");
        codeCol.setCellValueFactory(data -> data.getValue().courseCodeProperty());
        TableColumn<Course, String> nameCol = new TableColumn<>("Course Name");
        nameCol.setCellValueFactory(data -> data.getValue().courseNameProperty());
        TableColumn<Course, Number> creditsCol = new TableColumn<>("Credits");
        creditsCol.setCellValueFactory(data -> data.getValue().creditsProperty());
        TableColumn<Course, Number> seatsCol = new TableColumn<>("Seats Left");
        seatsCol.setCellValueFactory(data -> data.getValue().seatsAvailableProperty());

        catalogTable.getColumns().addAll(codeCol, nameCol, creditsCol, seatsCol);
        catalogTable.setItems(FXCollections.observableArrayList(DataStore.getCoursesSorted()));

        Button requestButton = new Button("Request Enrollment (Enqueue)");
        requestButton.setOnAction(e -> {
            Course selected = catalogTable.getSelectionModel().getSelectedItem();
            if (selected == null) {
                showAlert(Alert.AlertType.WARNING, "No Course Selected", "Select a course first.");
                return;
            }
            if (selected.getSeatsAvailable() <= 0) {
                showAlert(Alert.AlertType.WARNING, "No Seats", selected.getCourseName() + " is full.");
                return;
            }
            DataStore.requestEnrollment(currentUser.getStudentId(), selected.getId());
            showAlert(Alert.AlertType.INFORMATION, "Request Submitted",
                    "Your enrollment request for " + selected.getCourseCode() +
                    " has been queued for admin approval.");
        });

        Button transcriptButton = new Button("View My Transcript (Graph Traversal)");
        transcriptButton.setOnAction(e -> showTranscriptView());

        VBox box = new VBox(10, title, catalogTable, requestButton, transcriptButton);
        box.setPadding(new Insets(10));
        return box;
    }

    private void showTranscriptView() {
        var transcript = DataStore.getStudentTranscript(currentUser.getStudentId());

        ListView<Course> listView = new ListView<>(FXCollections.observableArrayList(transcript));
        listView.setCellFactory(lv -> new ListCell<Course>() {
            @Override
            protected void updateItem(Course course, boolean empty) {
                super.updateItem(course, empty);
                setText((empty || course == null) ? null :
                        course.getCourseCode() + " - " + course.getCourseName() + " (" + course.getCredits() + " credits)");
            }
        });

        VBox layout = new VBox(10, new Label("Enrolled Courses (via enrollment graph)"), listView);
        layout.setPadding(new Insets(10));

        Stage stage = new Stage();
        stage.setTitle("My Transcript");
        stage.setScene(new Scene(layout, 450, 350));
        stage.initOwner(primaryStage);
        stage.show();
    }

    // ================= ADMIN PANEL =================

    private void showAdminView() {
        BorderPane root = new BorderPane();

        TableView<RegistrationRequest> requestTable = createRequestQueueTable();

        Button processButton = new Button("Process Next Request (Dequeue)");
        processButton.setOnAction(e -> processNextRequest(requestTable));

        Button rosterButton = new Button("View Student Roster (Linked List)");
        rosterButton.setOnAction(e -> showRosterView());

        Button historyButton = new Button("View Action History (Stack)");
        historyButton.setOnAction(e -> showActionHistoryView());

        VBox controls = new VBox(10,
                new Label("Pending Registration Requests (Queue - FIFO):"),
                requestTable, processButton, new Separator(), rosterButton, historyButton);
        controls.setPadding(new Insets(10));

        root.setCenter(controls);
        root.setTop(createHeaderBar("Admin Panel"));

        Scene scene = new Scene(root, 750, 550);
        primaryStage.setScene(scene);
    }

    private TableView<RegistrationRequest> createRequestQueueTable() {
        TableView<RegistrationRequest> table = new TableView<>();

        TableColumn<RegistrationRequest, Integer> idCol = new TableColumn<>("Request ID");
        idCol.setCellValueFactory(data -> new javafx.beans.property.SimpleIntegerProperty(
                data.getValue().getRequestId()).asObject());

        TableColumn<RegistrationRequest, String> studentCol = new TableColumn<>("Student");
        studentCol.setCellValueFactory(data -> new javafx.beans.property.SimpleStringProperty(
                DataStore.findStudentById(data.getValue().getStudentId())
                        .map(Student::getRollNo).orElse("Unknown")));

        TableColumn<RegistrationRequest, String> courseCol = new TableColumn<>("Course");
        courseCol.setCellValueFactory(data -> new javafx.beans.property.SimpleStringProperty(
                DataStore.findCourseById(data.getValue().getCourseId())
                        .map(Course::getCourseCode).orElse("Unknown")));

        table.getColumns().addAll(idCol, studentCol, courseCol);
        table.setItems(FXCollections.observableArrayList(DataStore.getPendingRequests()));
        return table;
    }

    private void processNextRequest(TableView<RegistrationRequest> requestTable) {
        Optional<RegistrationRequest> next = DataStore.processNextRequest();
        if (next.isPresent()) {
            RegistrationRequest r = next.get();
            showAlert(Alert.AlertType.INFORMATION, "Request Processed",
                    String.format("Request #%d has been approved and removed from the queue.", r.getRequestId()));
        } else {
            showAlert(Alert.AlertType.INFORMATION, "Queue Empty", "No pending requests to process.");
        }
        requestTable.setItems(FXCollections.observableArrayList(DataStore.getPendingRequests()));
    }

    private void showRosterView() {
        TableView<Student> rosterTable = new TableView<>();
        TableColumn<Student, String> rollCol = new TableColumn<>("Roll No");
        rollCol.setCellValueFactory(data -> data.getValue().rollNoProperty());
        TableColumn<Student, String> nameCol = new TableColumn<>("Name");
        nameCol.setCellValueFactory(data -> data.getValue().nameProperty());
        TableColumn<Student, String> deptCol = new TableColumn<>("Department");
        deptCol.setCellValueFactory(data -> data.getValue().departmentProperty());
        TableColumn<Student, Number> gpaCol = new TableColumn<>("GPA");
        gpaCol.setCellValueFactory(data -> data.getValue().gpaProperty());

        rosterTable.getColumns().addAll(rollCol, nameCol, deptCol, gpaCol);
        rosterTable.setItems(FXCollections.observableArrayList(DataStore.getStudentRoster()));

        VBox layout = new VBox(10, new Label("Student Roster (Linked List)"), rosterTable);
        layout.setPadding(new Insets(10));

        Stage stage = new Stage();
        stage.setTitle("Student Roster");
        stage.setScene(new Scene(layout, 550, 400));
        stage.initOwner(primaryStage);
        stage.show();
    }

    private void showActionHistoryView() {
        ListView<String> historyList = new ListView<>(
                FXCollections.observableArrayList(DataStore.getActionHistorySnapshot()));

        Button popButton = new Button("Pop Last Action (Stack.pop)");
        popButton.setOnAction(e -> {
            Optional<String> popped = DataStore.popLastAction();
            popped.ifPresentOrElse(
                    p -> historyList.setItems(FXCollections.observableArrayList(DataStore.getActionHistorySnapshot())),
                    () -> showAlert(Alert.AlertType.INFORMATION, "Stack Empty", "No actions left in history."));
        });

        VBox layout = new VBox(10, new Label("Action History (Stack - most recent first)"), historyList, popButton);
        layout.setPadding(new Insets(10));

        Stage stage = new Stage();
        stage.setTitle("Action History");
        stage.setScene(new Scene(layout, 500, 400));
        stage.initOwner(primaryStage);
        stage.show();
    }

    // ================= SHARED =================

    private HBox createHeaderBar(String title) {
        Label titleLabel = new Label(title);
        titleLabel.setStyle("-fx-font-size: 18px; -fx-font-weight: bold;");

        Button settingsButton = new Button("Account Settings");
        settingsButton.setOnAction(e -> showAccountSettingsDialog());

        Button logoutButton = new Button("Logout");
        logoutButton.setOnAction(e -> {
            currentUser = null;
            showLoginScreen();
        });

        HBox header = new HBox(titleLabel, new Region(), settingsButton, logoutButton);
        HBox.setHgrow(header.getChildren().get(1), Priority.ALWAYS);
        header.setSpacing(10);
        header.setPadding(new Insets(10));
        header.setStyle("-fx-border-color: #ccc; -fx-border-width: 0 0 1 0;");
        return header;
    }

    private void showAccountSettingsDialog() {
        GridPane grid = new GridPane();
        grid.setPadding(new Insets(20));
        grid.setVgap(10);
        grid.setHgap(10);

        TextField usernameField = new TextField(currentUser.getUsername());
        PasswordField newPasswordField = new PasswordField();
        newPasswordField.setPromptText("Leave blank to keep current password");
        Button saveButton = new Button("Save Changes");

        grid.add(new Label("Username:"), 0, 0);
        grid.add(usernameField, 1, 0);
        grid.add(new Label("New Password:"), 0, 1);
        grid.add(newPasswordField, 1, 1);
        grid.add(saveButton, 1, 2);

        Stage dialog = new Stage();
        dialog.setTitle("Account Settings");
        dialog.initOwner(primaryStage);
        dialog.setScene(new Scene(grid, 320, 160));

        saveButton.setOnAction(e -> {
            String newUsername = usernameField.getText().trim();
            String newPassword = newPasswordField.getText();

            if (newUsername.isEmpty()) {
                showAlert(Alert.AlertType.WARNING, "Invalid Username", "Username cannot be blank.");
                return;
            }

            boolean success = DataStore.changeCredentials(currentUser, newUsername, newPassword);
            if (success) {
                showAlert(Alert.AlertType.INFORMATION, "Saved", "Your account details have been updated.");
                dialog.close();
            } else {
                showAlert(Alert.AlertType.ERROR, "Username Taken",
                        "That username is already in use. Please choose another.");
            }
        });

        dialog.show();
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
