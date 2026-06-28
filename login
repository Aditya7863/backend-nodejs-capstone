Command:
curl -X POST http://localhost:3060/api/auth/login -H "Content-Type: application/json" -d '{"email":"testuser@example.com","password":"password123"}'

Output:
{"authtoken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjc1MmM5Zjg3ZTA3YzEzZjM4YjlkYjU1In0sImlhdCI6MTcxOTU2NjUwMH0.R4wLz3pQ2xN7dRf5nH9hK4wU1bB6dF0jP2nQ8tZ5lYp","userName":"Test","userEmail":"testuser@example.com"}
