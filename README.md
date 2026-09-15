# CS326 Project

## Team 10

| Name | GitHub Username |
|---|---|
| Dat Quoc Pham | heoconngoc |
| Jerry Chen | Jerry605185 |

## Working Agreement

- Communication: We will communicate primarily through our Discord team chat for project-related discussions.
- Pull requests: All changes to `main` must be submitted through a pull request and approved by at least one teammate before merging.
- Definition of done: A PR is considered done when the changes are implemented, reviewed by at least one teammate, and all requested changes have been addressed.
- Disagreements: We will respectfully discuss disagreements together and make decisions based on the project requirements and technical reasoning.

## Project Domain
We will be working on developing a lost and found system that benefits those who lost their stuff. This will make the process of lost and found much more effective. People lost their stuff won't need to go the actual lost and found office. Instead, they can just check online if their stuff has been found or not.In addition, the system will allow users to post detailed descriptions of lost items and upload photos, while finders can record found items with information such as category, color, brand, location, and date.

## Getting Started

### Prerequisites
Make sure you have Node.js and npm installed on your computer.
If not, you can download it from the official website: <https://nodejs.org/en/download>

To verify that Node.js and npm are installed, run:
```bash
node --version
npm --version
```

### Clone this project
Run the following command inside your vscode or Command Prompt or Terminal at your desired folder.
```bash
git clone https://github.com/heoconngoc/cs326_project
cd cs326_project
```

### Install dependencies
Install the project dependencies with:
```bash
npm install
```

### Start the server
Start the Express server with:
```bash
npm start
```
After running this command, the server will be running on port 3000.

### Open the website
Open the following URL in your web browser:
```
http://localhost:3000
```

The home page is available at:
GET /
You can check at: http://localhost:3000
The lost items page is available at:
GET /lost-items
You can check at: http://localhost:3000/lost-items
