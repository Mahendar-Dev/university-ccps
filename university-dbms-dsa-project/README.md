# 🎓 University Database Management System (DSA Edition)

[![Java](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![JavaFX](https://img.shields.io/badge/JavaFX-21.0.2-2596BE?style=for-the-badge&logo=java&logoColor=white)](https://openjfx.io/)
[![Maven](https://img.shields.io/badge/Maven-3.9-C71A36?style=for-the-badge&logo=apachemaven&logoColor=white)](https://maven.apache.org/)
[![IntelliJ IDEA](https://img.shields.io/badge/IntelliJ%20IDEA-000000?style=for-the-badge&logo=intellijidea&logoColor=white)](https://www.jetbrains.com/idea/)
[![Maven Central](https://img.shields.io/badge/Build-Maven-orange?style=for-the-badge&logo=apachemaven&logoColor=white)](#-setup--run-instructions-intellij-idea)
[![License](https://img.shields.io/badge/License-MIT-informational?style=for-the-badge)](#-license)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge)](#-license)

<p align="center">
  <a href="#-setup--run-instructions-intellij-idea"><img src="https://img.shields.io/badge/🚀_Get_Started-2ea44f?style=for-the-badge"></a>
  <a href="#-dsa-concepts-checklist"><img src="https://img.shields.io/badge/📋_DSA_Checklist-blue?style=for-the-badge"></a>
  <a href="#-repository-structure"><img src="https://img.shields.io/badge/📁_Structure-lightgrey?style=for-the-badge"></a>
  <a href="#system-access"><img src="https://img.shields.io/badge/🔑_Login_Accounts-purple?style=for-the-badge"></a>
</p>

**University DBMS** is a JavaFX desktop application built to demonstrate core **Data Structures & Algorithms** concepts through a realistic, working use case: student course registration. Instead of implementing DSA operations in isolation, each one is wired into an actual feature — enrollment requests really flow through a Queue, the course catalog really lives in a Binary Search Tree, and so on.

This repository contains the complete source code and Maven build configuration for the DSA course project.

---

## 🎯 The Problem This Project Solves

[#-the-problem-this-project-solves](#-the-problem-this-project-solves)

Most DSA assignments implement structures like queues, linked lists, and BSTs as disconnected demo programs that print to a console — useful for the exam, but disconnected from how these structures are actually used in software.

- **The Challenge:** Show a working understanding of DSA concepts in a context that resembles a real system, with a UI, multiple user roles, and persistent-feeling state during a session.
- **The Solution:** A JavaFX course-registration app where every core action is backed by a specific, purpose-built data structure — not just for the sake of using it, but because it is the natural fit for that operation (FIFO processing → Queue, LIFO undo history → Stack, sorted lookup → BST, relationship mapping → HashMap-based graph).

---

## 🏗️ Architecture Overview

[#-architecture-overview](#-architecture-overview)

The system follows a simple three-layer desktop architecture:

1. **Presentation Layer (UI):** Built with **JavaFX** — login screen, Student Portal, and Admin Panel, all driven by `MainApplication.java`.
2. **Domain Models:** Plain Java objects (`Student`, `Course`, `User`, `RegistrationRequest`) exposing JavaFX properties so UI tables update reactively.
3. **Data & Logic Layer:** `DataStore.java` — a single class centralizing every data structure operation (queue, linked list, BST, stack, graph) so the DSA logic is easy to locate, read, and demo independently of the UI.
4. **Build System:** **Maven**, using the `javafx-maven-plugin` to resolve JavaFX modules and run the app without manual module-path configuration.
5. **In-memory storage:** No database — all state (users, students, courses, requests) lives in memory and resets on restart, keeping the focus on the data structures themselves.

---

## 📁 Repository Structure

[#-repository-structure](#-repository-structure)

```
📦 university-project
 ┣ 📂 src/main/java
 ┃ ┣ 📜 module-info.java        # JavaFX module declaration
 ┃ ┣ 📂 university              # UI + domain models
 ┃ ┃ ┣ 📜 MainApplication.java  # App entry point, login, admin & student views
 ┃ ┃ ┣ 📜 Student.java          # Domain model (JavaFX properties)
 ┃ ┃ ┣ 📜 Course.java           # Domain model (JavaFX properties)
 ┃ ┃ ┣ 📜 RegistrationRequest.java
 ┃ ┃ ┗ 📜 User.java             # Login credentials + role
 ┃ ┗ 📂 util
 ┃   ┗ 📜 DataStore.java        # Queue, LinkedList, BST, Stack, HashMap-graph logic
 ┣ 📜 pom.xml                   # Maven build config + JavaFX plugin
 ┣ 📜 .gitignore
 ┗ 📜 README.md
```

---

## ✅ DSA Concepts Checklist

[#-dsa-concepts-checklist](#-dsa-concepts-checklist)

- [x] **Queue (FIFO):** `Queue<RegistrationRequest>` — pending course registration requests, processed in arrival order.
- [x] **Linked List:** `LinkedList<Student>` — the student roster.
- [x] **Binary Search Tree:** Custom `CourseBSTNode` — course catalog, keyed and sorted by course ID via in-order traversal.
- [x] **Stack (LIFO):** `java.util.Stack<String>` — admin action history, with a live push/pop demo in the UI.
- [x] **Graph (adjacency-list style):** `HashMap<Integer, List<Integer>>` — student-to-enrolled-courses relationship, used to build transcripts.
- [x] **ArrayList / HashMap lookups:** user accounts, course-by-ID, and request-by-ID lookups.
- [x] **Role-based access:** Two distinct views (Admin / Student) built on the same login flow.

---

## 🧩 Tech Stack

[#-tech-stack](#-tech-stack)

| Layer              | Technology                                  |
|--------------------|----------------------------------------------|
| Language            | Java 17                                      |
| UI Framework        | JavaFX 21.0.2 (Controls, Graphics, Base, FXML) |
| Build Tool           | Maven (`javafx-maven-plugin`)                |
| IDE                 | IntelliJ IDEA                                |
| Module System        | Java Platform Module System (`module-info.java`) |
| Data Storage         | In-memory (Java Collections Framework)       |

---

## 🛠️ Setup & Run Instructions (IntelliJ IDEA)

[#️-setup--run-instructions-intellij-idea](#️-setup--run-instructions-intellij-idea)

### Prerequisites

[#prerequisites](#prerequisites)

1. **JDK 17+** — IntelliJ can auto-download this if you don't have it.
2. **IntelliJ IDEA** (Community or Ultimate) — Maven support is built in.
3. **Internet access** on first build — Maven needs to download the JavaFX dependencies.

### Step 1: Open the Project

[#step-1-open-the-project](#step-1-open-the-project)

- **File → Open**, select the `university-project` folder (the one containing `pom.xml`).
- Do **not** create a new project via IntelliJ's wizard first — just open this folder directly.

### Step 2: Load Maven & Trust the Project

[#step-2-load-maven--trust-the-project](#step-2-load-maven--trust-the-project)

- Click **Load Maven Project** when prompted (or use the Maven tool window → refresh icon).
- Click **Trust Project** if asked.
- Set the Project SDK to JDK 17+ if prompted (**File → Project Structure → Project**).

### Step 3: Run the App

[#step-3-run-the-app](#step-3-run-the-app)

Recommended — run via Maven, which correctly resolves the JavaFX module path:

```
mvn clean javafx:run
```

Or, from the Maven tool window: `university-project → Plugins → javafx → javafx:run`.

Alternative — right-click `src/main/java/university/MainApplication.java` → **Run 'MainApplication.main()'**.
If you see a *"JavaFX runtime components are missing"* error, switch to the `mvn javafx:run` method above.

### System Access

[#system-access](#system-access)

When the app opens, log in with one of the seeded accounts:

| Username      | Password | Role    |
|---------------|----------|---------|
| admin         | admin123 | ADMIN   |
| Mahendar-Dev  | notyou   | STUDENT |
| Ahmad-Raza    | notme    | STUDENT |

Each account's username and password can also be changed at any time from **Account Settings** in the app header.

---

## 🖥️ What Each Role Can Do

[#️-what-each-role-can-do](#️-what-each-role-can-do)

**Student:** Browse the course catalog (BST, sorted by ID) → Request Enrollment (enqueues a request) → View Transcript (traverses the enrollment graph).

**Admin:** View the pending request Queue → Process Next Request (dequeues and approves it) → View Student Roster (Linked List) → View/Pop Action History (Stack).

---

## 📄 License

[#-license](#-license)

This project is provided for academic and educational use.

---

*Developed as a Data Structures & Algorithms (DSA) course project.*
