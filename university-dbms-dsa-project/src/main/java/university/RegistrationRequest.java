package university;

import java.util.Date;

public class RegistrationRequest {
    private final int requestId;
    private final int studentId;
    private final int courseId;
    private final Date timestamp;
    private boolean approved;

    public RegistrationRequest(int requestId, int studentId, int courseId) {
        this.requestId = requestId;
        this.studentId = studentId;
        this.courseId = courseId;
        this.timestamp = new Date();
        this.approved = false;
    }

    public int getRequestId() { return requestId; }
    public int getStudentId() { return studentId; }
    public int getCourseId() { return courseId; }
    public Date getTimestamp() { return timestamp; }
    public boolean isApproved() { return approved; }
    public void setApproved(boolean approved) { this.approved = approved; }

    @Override
    public String toString() {
        return String.format("Request #%d (Student: %d, Course: %d)", requestId, studentId, courseId);
    }
}
