package util;

import university.User;
import university.Student;
import university.Course;
import university.RegistrationRequest;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.Queue;
import java.util.Stack;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/** Node used by the course catalog Binary Search Tree, keyed on Course.id. */
class CourseBSTNode {
    Course course;
    CourseBSTNode left, right;

    public CourseBSTNode(Course course) {
        this.course = course;
        this.left = this.right = null;
    }
}

public class DataStore {

    // --- Array/ArrayList: login accounts ---
    private static final List<User> users = new ArrayList<>();

    // --- Linked List: student roster ---
    private static final LinkedList<Student> studentRoster = new LinkedList<>();

    // --- Queue (FIFO): pending course registration requests ---
    private static final Queue<RegistrationRequest> pendingRequests = new LinkedList<>();

    // --- Binary Search Tree: course catalog sorted by course id ---
    private static CourseBSTNode courseBST = null;

    // --- Stack (LIFO): admin action history ---
    private static final Stack<String> actionHistory = new Stack<>();

    // --- HashMap-based graph: studentId -> list of enrolled courseIds (transcript) ---
    private static final Map<Integer, List<Integer>> enrollmentGraph = new HashMap<>();

    // --- Lookup maps ---
    private static final Map<Integer, RegistrationRequest> requestMap = new HashMap<>();
    private static final Map<Integer, Course> courseMap = new HashMap<>();

    private static int nextUserId = 1;
    private static int nextStudentId = 1;
    private static int nextCourseId = 101;
    private static int nextRequestId = 5001;

    static {
        // Seed an admin and two students
        Student alice = addStudent("F23-BSCS-001", "Alice Khan", "Computer Science", 3.7);
        Student bilal = addStudent("F23-BSCS-002", "Bilal Ahmed", "Computer Science", 3.4);

        addUser(new User(nextUserId++, "admin", "admin123", "ADMIN", -1));
        addUser(new User(nextUserId++, "alice", "pass123", "STUDENT", alice.getId()));
        addUser(new User(nextUserId++, "bilal", "pass123", "STUDENT", bilal.getId()));

        // Seed some courses
        addCourse("CS101", "Introduction to Programming", 3, 30);
        addCourse("CS201", "Data Structures & Algorithms", 4, 25);
        addCourse("MA101", "Calculus I", 3, 40);
        addCourse("EN101", "English Composition", 2, 50);

        actionHistory.push("System initialized with seed data.");
    }

    // ---------- Users (Array/List) ----------
    public static void addUser(User user) {
        users.add(user);
    }

    public static Optional<User> findUser(String username, String password) {
        return users.stream()
                .filter(u -> u.getUsername().equals(username) && u.getPassword().equals(password))
                .findFirst();
    }

    public static boolean isUsernameTaken(String username, int excludingUserId) {
        return users.stream()
                .anyMatch(u -> u.getId() != excludingUserId && u.getUsername().equalsIgnoreCase(username));
    }

    /**
     * Updates a user's username and/or password in place.
     * Returns false if the requested username is already taken by another account.
     */
    public static boolean changeCredentials(User user, String newUsername, String newPassword) {
        if (newUsername != null && !newUsername.isBlank()) {
            if (isUsernameTaken(newUsername, user.getId())) {
                return false;
            }
            user.setUsername(newUsername);
        }
        if (newPassword != null && !newPassword.isBlank()) {
            user.setPassword(newPassword);
        }
        actionHistory.push("Credentials updated for user: " + user.getUsername());
        return true;
    }

    // ---------- Students (Linked List) ----------
    public static Student addStudent(String rollNo, String name, String department, double gpa) {
        Student student = new Student(nextStudentId++, rollNo, name, department, gpa);
        studentRoster.add(student);
        return student;
    }

    public static LinkedList<Student> getStudentRoster() {
        return studentRoster;
    }

    public static Optional<Student> findStudentById(int studentId) {
        return studentRoster.stream().filter(s -> s.getId() == studentId).findFirst();
    }

    // ---------- Courses (Binary Search Tree, keyed on course id) ----------
    public static Course addCourse(String code, String name, int credits, int seats) {
        Course course = new Course(nextCourseId++, code, name, credits, seats);
        courseMap.put(course.getId(), course);
        courseBST = insertIntoBST(courseBST, course);
        return course;
    }

    private static CourseBSTNode insertIntoBST(CourseBSTNode root, Course course) {
        if (root == null) {
            return new CourseBSTNode(course);
        }
        if (course.getId() < root.course.getId()) {
            root.left = insertIntoBST(root.left, course);
        } else if (course.getId() > root.course.getId()) {
            root.right = insertIntoBST(root.right, course);
        }
        return root;
    }

    public static List<Course> getCoursesSorted() {
        List<Course> sorted = new ArrayList<>();
        inOrderTraversal(courseBST, sorted);
        return sorted;
    }

    private static void inOrderTraversal(CourseBSTNode node, List<Course> list) {
        if (node != null) {
            inOrderTraversal(node.left, list);
            list.add(node.course);
            inOrderTraversal(node.right, list);
        }
    }

    public static Optional<Course> findCourseById(int courseId) {
        return Optional.ofNullable(courseMap.get(courseId));
    }

    // ---------- Registration requests (Queue - FIFO) ----------
    public static void requestEnrollment(int studentId, int courseId) {
        RegistrationRequest request = new RegistrationRequest(nextRequestId++, studentId, courseId);
        pendingRequests.offer(request);
        requestMap.put(request.getRequestId(), request);

        Student s = findStudentById(studentId).orElse(null);
        Course c = findCourseById(courseId).orElse(null);
        actionHistory.push(String.format("Enrollment requested: %s -> %s",
                s != null ? s.getRollNo() : "Student#" + studentId,
                c != null ? c.getCourseCode() : "Course#" + courseId));
    }

    public static Queue<RegistrationRequest> getPendingRequests() {
        return pendingRequests;
    }

    public static Optional<RegistrationRequest> processNextRequest() {
        RegistrationRequest request = pendingRequests.poll();
        if (request != null) {
            request.setApproved(true);

            // Add edge to the enrollment graph: student -> course
            enrollmentGraph.computeIfAbsent(request.getStudentId(), k -> new ArrayList<>())
                    .add(request.getCourseId());

            // Decrement available seats in the course catalog
            findCourseById(request.getCourseId()).ifPresent(c ->
                    c.setSeatsAvailable(Math.max(0, c.getSeatsAvailable() - 1)));

            Student s = findStudentById(request.getStudentId()).orElse(null);
            Course c = findCourseById(request.getCourseId()).orElse(null);
            actionHistory.push(String.format("Approved: %s enrolled in %s",
                    s != null ? s.getRollNo() : "Student#" + request.getStudentId(),
                    c != null ? c.getCourseCode() : "Course#" + request.getCourseId()));

            return Optional.of(request);
        }
        return Optional.empty();
    }

    // ---------- Transcript (Graph traversal via HashMap adjacency list) ----------
    public static List<Course> getStudentTranscript(int studentId) {
        List<Course> transcript = new ArrayList<>();
        List<Integer> courseIds = enrollmentGraph.getOrDefault(studentId, new ArrayList<>());
        for (Integer courseId : courseIds) {
            findCourseById(courseId).ifPresent(transcript::add);
        }
        return transcript;
    }

    // ---------- Action history (Stack - LIFO) ----------
    public static List<String> getActionHistorySnapshot() {
        // Return most-recent-first without mutating the stack
        List<String> snapshot = new ArrayList<>(actionHistory);
        java.util.Collections.reverse(snapshot);
        return snapshot;
    }

    public static Optional<String> popLastAction() {
        if (actionHistory.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(actionHistory.pop());
    }
}
