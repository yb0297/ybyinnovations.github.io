# YBY Innovations - Full-Stack Education Platform

A comprehensive education platform featuring JEE and NEET exam preparation with real-time leaderboards, progress tracking, and admin management system.

## Features

### For Students
- **Daily Practice Tests**: Fresh JEE and NEET questions every day
- **Real-time Leaderboard**: Compete with students nationwide
- **Progress Analytics**: Detailed performance tracking and insights
- **Streak Tracking**: Maintain daily practice streaks
- **Subject-wise Analysis**: Performance breakdown by subjects
- **Instant Results**: Get detailed results immediately after exam submission

### For Admins
- **Question Management**: Add daily questions for JEE and NEET
- **User Management**: View and manage all registered users
- **Analytics Dashboard**: Comprehensive platform analytics
- **GitHub Integration**: All data stored securely in GitHub repositories

### Technical Features
- **Full-Stack Application**: Node.js backend with vanilla JavaScript frontend
- **GitHub as Database**: Innovative use of GitHub for data storage
- **JWT Authentication**: Secure user authentication and authorization
- **Real-time Updates**: Live leaderboard and ranking updates
- **Responsive Design**: Works perfectly on all devices
- **RESTful API**: Clean and well-documented API endpoints

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_here

# GitHub Configuration
GITHUB_TOKEN=your_github_personal_access_token_here
GITHUB_REPO=your_username/your_repository_name
```

### 2. GitHub Setup

1. **Create a GitHub Repository** for data storage (e.g., `yby-innovations-data`)
2. **Generate Personal Access Token**:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate new token with `repo` permissions
   - Copy the token to your `.env` file

3. **Repository Structure** (will be created automatically):
   ```
   data/
   ├── users.json              # User data
   ├── exam-results.json       # Exam results
   └── questions/
       ├── jee/
       │   ├── 2025-01-15.json  # Daily JEE questions
       │   └── 2025-01-16.json
       └── neet/
           ├── 2025-01-15.json  # Daily NEET questions
           └── 2025-01-16.json
   ```

### 3. Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or start production server
npm start
```

### 4. Access the Application

- **Main Website**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin.html

### 5. Create Admin User

1. Register a normal user account
2. Manually edit the `data/users.json` file in your GitHub repository
3. Set `"isAdmin": true` for your user account
4. Access the admin panel to add questions

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login

### Exams
- `GET /api/questions/:examType` - Get daily questions
- `POST /api/submit-exam` - Submit exam answers

### User Data
- `GET /api/profile` - Get user profile
- `GET /api/leaderboard` - Get leaderboard data

### Admin (Requires Admin Access)
- `POST /api/admin/questions` - Add daily questions
- `GET /api/admin/users` - Get all users
- `GET /api/admin/analytics` - Get platform analytics

## Adding Daily Questions

### Via Admin Panel
1. Login as admin user
2. Go to Admin Panel → Manage Questions
3. Select exam type (JEE/NEET) and date
4. Add questions with options and correct answers
5. Save questions

### Question Format
```json
{
  "subject": "Physics",
  "question": "What is the SI unit of force?",
  "options": ["Newton", "Joule", "Watt", "Pascal"],
  "correct": 0,
  "difficulty": "easy"
}
```

## Data Storage

All data is stored in your GitHub repository as JSON files:

- **users.json**: User accounts and statistics
- **exam-results.json**: All exam submissions and results
- **questions/**: Daily questions organized by exam type and date

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for secure password storage
- **Admin Authorization**: Role-based access control
- **GitHub Token Security**: Secure API access to GitHub

## Deployment

### Heroku Deployment
1. Create Heroku app
2. Set environment variables in Heroku dashboard
3. Deploy using Git or GitHub integration

### Other Platforms
The application can be deployed on any Node.js hosting platform:
- Vercel
- Netlify Functions
- Railway
- DigitalOcean App Platform

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Submit pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue in the GitHub repository
- Contact: support@ybyinnovations.com

---

**YBY Innovations** - Empowering students through innovative technology and comprehensive exam preparation.