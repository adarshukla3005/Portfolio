# Interactive Portfolio Website with AI Chatbot

This is an interactive portfolio website featuring a Gemini-powered AI chatbot that can answer questions about the portfolio owner's skills, experience, and projects.

## Features

- Responsive design for desktop and mobile devices
- Interactive portfolio sections: About, Skills, Resume, Projects, Contact
- Google's Generative AI (Gemini) powered chatbot that answers questions about the portfolio
- Modern animations and transitions for an engaging user experience
- SEO-friendly structure

## Technologies Used

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- AI Integration: Google's Generative AI (Gemini API)
- RAG Implementation: In-memory vector store for retrieval-augmented generation
- Deployment: Can be deployed on various platforms (AWS, Azure, GCP, Netlify, etc.)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- NPM (v6 or higher)
- Google Gemini API key (get one from https://makersuite.google.com/app/apikey)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/portfolio-chatbot.git
   cd portfolio-chatbot
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory and add your Gemini API key:
   ```
   PORT=3000
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Chatbot Implementation

The chatbot uses a RAG (Retrieval-Augmented Generation) approach:
1. The content from the portfolio website is indexed and stored in an in-memory vector store
2. When a user asks a question, the system finds the most relevant content using vector similarity
3. The retrieved content is used as context for Gemini to generate an accurate response
4. Fallback responses are provided if the API is unavailable or doesn't return expected results

## Deployment

The application can be deployed to various platforms:

### Netlify/Vercel (Static frontend with serverless functions)
1. Create a new project on Netlify/Vercel
2. Connect your GitHub repository
3. Set environment variables in the platform's dashboard
4. Deploy

### Traditional Hosting (AWS, GCP, Azure)
1. Build the application: `npm run build`
2. Deploy the built files to your hosting provider
3. Set up environment variables on your server
4. Start the server: `npm start`

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Template based on Colorlib
- Google Generative AI for the chatbot functionality

## Adarsh Shukla

Check out my [Portfolio Website](https://adarshukla3005.github.io/) to learn more about my projects and experience.

## About Me

I am a third-year B.Tech. student majoring in Engineering Physics at IIT Roorkee with a passion for Data Science, Machine Learning, Finance, and Software Development. 

## Skills

- **Data Analysis**
- **Sentiment Analysis**
- **Machine Learning**
- **BI Tools**: Microsoft Power BI, Looker, Tableau
- **Programming & Tools**: TensorFlow, Keras, Matplotlib, Excel, Git, Google Analytics, SEO

## Experience

### Summer Intern at IIT Roorkee
- Developed an advanced TensorFlow/Keras model for 2D and 3D segmentation of human cells in microscopy images.
- Achieved 91% precision, 87% recall, and a Dice coefficient of 0.83.
- Automated preprocessing of over 12,000 3D images, enhancing signal-to-noise ratio by 28% and cutting processing time by 32%.

## Education

- **3rd Year**
- **B.Tech. in Engineering Physics** - IIT Roorkee

## Courses & Workshops

- Completed the [Machine Learning Specialization](https://www.coursera.org/specializations/machine-learning) by Andrew Ng on Coursera.
- Attended the Generative AI workshop by Intel at IIT Roorkee.
- Completed a DSA course, providing extensive knowledge in data structures and algorithms.

## Interests

- Traveling
- Finance
- Cricket

For more details and to explore my projects, visit my [Portfolio Website](https://adarshukla3005.github.io/).

