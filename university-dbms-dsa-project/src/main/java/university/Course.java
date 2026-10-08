package university;

import javafx.beans.property.*;

public class Course {
    private final int id;                       // used as the BST key
    private final SimpleStringProperty courseCode;
    private final SimpleStringProperty courseName;
    private final SimpleIntegerProperty credits;
    private final SimpleIntegerProperty seatsAvailable;

    public Course(int id, String courseCode, String courseName, int credits, int seatsAvailable) {
        this.id = id;
        this.courseCode = new SimpleStringProperty(courseCode);
        this.courseName = new SimpleStringProperty(courseName);
        this.credits = new SimpleIntegerProperty(credits);
        this.seatsAvailable = new SimpleIntegerProperty(seatsAvailable);
    }

    public int getId() { return id; }
    public String getCourseCode() { return courseCode.get(); }
    public String getCourseName() { return courseName.get(); }
    public int getCredits() { return credits.get(); }
    public int getSeatsAvailable() { return seatsAvailable.get(); }
    public void setSeatsAvailable(int seats) { this.seatsAvailable.set(seats); }

    public StringProperty courseCodeProperty() { return courseCode; }
    public StringProperty courseNameProperty() { return courseName; }
    public IntegerProperty creditsProperty() { return credits; }
    public IntegerProperty seatsAvailableProperty() { return seatsAvailable; }

    @Override
    public String toString() {
        return courseCode.get() + " - " + courseName.get();
    }
}
