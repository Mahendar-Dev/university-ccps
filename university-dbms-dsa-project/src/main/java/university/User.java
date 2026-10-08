package university;

public class User {
    private final int id;
    private String username;
    private String password;
    private final String role;       // "ADMIN" or "STUDENT"
    private final int studentId;     // links to Student.id when role == STUDENT, -1 otherwise

    public User(int id, String username, String password, String role, int studentId) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.role = role;
        this.studentId = studentId;
    }

    public int getId() { return id; }
    public String getUsername() { return username; }
    public String getPassword() { return password; }
    public String getRole() { return role; }
    public int getStudentId() { return studentId; }

    public void setUsername(String username) { this.username = username; }
    public void setPassword(String password) { this.password = password; }

    @Override
    public String toString() {
        return "User ID: " + id + ", Username: " + username + ", Role: " + role;
    }
}
