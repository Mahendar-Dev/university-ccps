package university;

import javafx.beans.property.*;

public class Student {
    private final int id;
    private final SimpleStringProperty rollNo;
    private final SimpleStringProperty name;
    private final SimpleStringProperty department;
    private final SimpleDoubleProperty gpa;

    public Student(int id, String rollNo, String name, String department, double gpa) {
        this.id = id;
        this.rollNo = new SimpleStringProperty(rollNo);
        this.name = new SimpleStringProperty(name);
        this.department = new SimpleStringProperty(department);
        this.gpa = new SimpleDoubleProperty(gpa);
    }

    public int getId() { return id; }
    public String getRollNo() { return rollNo.get(); }
    public String getName() { return name.get(); }
    public String getDepartment() { return department.get(); }
    public double getGpa() { return gpa.get(); }

    public StringProperty rollNoProperty() { return rollNo; }
    public StringProperty nameProperty() { return name; }
    public StringProperty departmentProperty() { return department; }
    public DoubleProperty gpaProperty() { return gpa; }

    @Override
    public String toString() {
        return rollNo.get() + " - " + name.get() + " (" + department.get() + ")";
    }
}
