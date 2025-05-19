%-------------------------
% Resume in Latex
% Author : Vibhor Rastogi
% Based off of: https://github.com/sb2nov/resume
% License : MIT
%------------------------

\documentclass[letterpaper,11pt]{article}
\usepackage[dvipsnames]{xcolor}
\usepackage[colorlinks = true,
            linkcolor = MidnightBlue,
            urlcolor  = MidnightBlue,
            citecolor = MidnightBlue,
            anchorcolor = MidnightBlue]{hyperref}

\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage[english]{babel}
\usepackage{tabularx}
\usepackage{fontawesome5}
\usepackage{multicol}
\setlength{\multicolsep}{-3.0pt}
\setlength{\columnsep}{-1pt}
\input{glyphtounicode}


%----------FONT OPTIONS----------
% sans-serif
% \usepackage[sfdefault]{FiraSans}
% \usepackage[sfdefault]{roboto}
% \usepackage[sfdefault]{noto-sans}
% \usepackage[default]{sourcesanspro}

% serif
% \usepackage{CormorantGaramond}
% \usepackage{charter}


\pagestyle{fancy}
\fancyhf{} % clear all header and footer fields
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

% Adjust margins
\addtolength{\oddsidemargin}{-0.6in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1.19in}
\addtolength{\topmargin}{-.7in}
\addtolength{\textheight}{1.4in}

\urlstyle{same}

\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}

% Sections formatting
\titleformat{\section}{
  \vspace{-4pt}\scshape\raggedright\large\bfseries
}{}{0em}{}[\color{black}\titlerule \vspace{-5pt}]

% Ensure that generate pdf is machine readable/ATS parsable
\pdfgentounicode=1

%-------------------------
% Custom commands
\newcommand{\resumeItem}[1]{
  \item\small{
    {#1 \vspace{-2pt}}
  }
}

\newcommand{\classesList}[4]{
    \item\small{
        {#1 #2 #3 #4 \vspace{-2pt}}
  }
}

\newcommand{\resumeSubheading}[4]{
  \vspace{-2pt}\item
    \begin{tabular*}{1.0\textwidth}[t]{l@{\extracolsep{\fill}}r}
      \textbf{#1} & \textbf{\small #2} \\
      \textit{\small#3} & \textit{\small #4} \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeSubSubheading}[2]{
    \item
    \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
      \textit{\small#1} & \textit{\small #2} \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeProjectHeading}[2]{
    \item
    \begin{tabular*}{1.001\textwidth}{l@{\extracolsep{\fill}}r}
      \small#1 & \textbf{\small #2}\\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeSubItem}[1]{\resumeItem{#1}\vspace{-4pt}}

\renewcommand\labelitemi{$\vcenter{\hbox{\tiny$\bullet$}}$}
\renewcommand\labelitemii{$\vcenter{\hbox{\tiny$\bullet$}}$}

\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.0in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%


\begin{document}

%----------HEADING----------
% \begin{tabular*}{\textwidth}{l@{\extracolsep{\fill}}r}
%   \textbf{\href{http://sourabhbajaj.com/}{\Large Sourabh Bajaj}} & Email : \href{mailto:sourabh@sourabhbajaj.com}{sourabh@sourabhbajaj.com}\\
%   \href{http://sourabhbajaj.com/}{http://www.sourabhbajaj.com} & Mobile : +1-123-456-7890 \\
% \end{tabular*}

\begin{center}
    {\Huge \scshape Vibhor Rastogi} \\ \vspace{2pt}
    Noida, India \\ \vspace{7pt}
    \small \raisebox{-0.1\height}\faPhone\ 
    +91-9450474480~ {\raisebox{-0.2\height}\faEnvelope\  {vibhor.rastogi247@gmail.com}} ~ 
    \href{https://www.linkedin.com/in/vibhor-rastogi/}{\raisebox{-0.2\height}\faLinkedin\ \underline {linkedin.com/in/vibhor-rastogi}}  
    \vspace{2pt}
\end{center}

\section{Experience Summary}  \vspace{2pt}
\resumeItemListStart
  \resumeItem{4.5+ years of experience in backend development, specializing in Node.js and cloud-native architectures.}
  \vspace{-2pt}
  \resumeItem{Designed and deployed scalable microservices, serverless systems, and monolithic applications across diverse domains.}
  \vspace{-2pt}
  \resumeItem{Hands-on experience with cloud platforms (Azure, AWS), including services like Azure Functions and Cosmos DB.}
  \vspace{-2pt}
  \resumeItem{Implemented CI/CD pipelines, conducted rigorous code reviews, and enforced code quality standards with tools like SonarLint.}
  \vspace{-2pt}
    \resumeItem{Built secure and robust systems with role-based access control and RESTful APIs.}
    \vspace{-2pt}
  \resumeItem{Proficient in debugging, system design, and solving complex backend challenges in fast-paced agile environments.}
  \vspace{-2pt}
\resumeItemListEnd
%-----------EDUCATION-----------
\section{Education}
  \resumeSubHeadingListStart

  \resumeSubheading
      {KIET Group of Institutions, Ghaziabad}{2020}
      {\normalfont Bachelor of Technology in Computer Science}{\normalfont Ghaziabad, India}
      \\ \vspace{9pt}
      {Percentage : 78.9 \%}
           
    
    \resumeSubheading
      {CBSE}{2013}
      {\normalfont Senior Secondary (10+2)}{\normalfont Lakhimpur, India}
      \\ \vspace{9pt}
      {Percentage : 88\%}

    \resumeSubheading
      {CBSE}{2011}
      {\normalfont Secondary (10)}{\normalfont Lakhimpur, India}
      \\ \vspace{9pt}
      {Percentage : 78\%}
     
  \resumeSubHeadingListEnd
  \vspace{-16pt}
%-----------EXPERIENCE2-----------
\section{Experience}  \vspace{-2pt}
  
    \resumeSubheading 
      {AppInventiv }{June 2023 - Present}
      {\normalfont Software Engineer} 
      {\normalfont Noida, India}
    \vspace{8pt}
       
     \textbf{Projects}


%-----------PROJECTS-----------

\resumeSubSubheading
{\normalfont Americana Restaurant Management Platform} \\ \vspace{4pt}
\resumeItemListStart
  \resumeItem{Developed and maintained scalable backend services for Americana’s restaurant brands (KFC, Pizza Hut, Hardee’s, Krispy Kreme) across the Middle East region.}
  \vspace{-2pt}
  \resumeItem{Implemented \textbf{Restops.me}, a monitoring tool for restaurant availability. Built a mailer service that alerts operations teams if a restaurant is offline for over 5 minutes, ensuring rapid incident response.}
  \vspace{-2pt}
  \resumeItem{Led the development of a multi-brand kiosk 
  \vspace{-2pt}backend, enabling ordering for different brands from a single device. Currently live across UAE outlets.}
  \vspace{-2pt}
  \resumeItem{Designed a cross-brand \textbf{Loyalty Coupon system} redeemable at any store across supported brands, boosting retention and unifying the customer rewards experience.}
  \vspace{-2pt}
  \resumeItem{Built the \textbf{DeltaChanges service}, an intelligent menu propagation system that tracks updates in base items and pushes relevant changes to customer-facing kiosks in real-time.}
  \vspace{-2pt}
  \resumeItem{Engineered a Role-Based Access Control (\textbf{RBAC}) system using Azure Active Directory, supporting fine-grained permissions across multiple brands and countries.}
\vspace{-2pt}
\resumeItemListEnd
    \resumeSubSubHeadingListEnd
    \vspace{12pt}
    

%-----------EXPERIENCE2-----------
  
    \resumeSubheading
      {DLT Labs}{Oct 2020 -- May 2023}
      {\normalfont Software Engineer}{\normalfont Noida, India}
 \vspace{8pt}
 
%-----------PROJECTS-----------
\textbf{Projects}

    \resumeSubSubheading
     {\normalfont  NFT(Non fungible tokens) Selling Platform}\\
      \vspace{2pt}
      \resumeItemListStart
        \resumeItem{Have been part of research and development team, designed and worked on multiple scalable micro-services and also worked on smart contract in Solidity for ethereum.}
        \vspace{-2pt}
        \resumeItem{Worked on microservices for creating an order and trading NFTs.}
        \vspace{-2pt}      
        \resumeItem{Wrote solidity smart contracts allowing NFTs to be minted on our platform.}
        \vspace{-2pt}
        \resumeItem{Added functionality to onboard 3rd party tokens to our platform, which allows to trade any erc-1155 compliant NFT on our platform.}
        \vspace{-2pt}
        \resumeItem{Created 7200 NFTs for a client on testnet for pitching our platform. }

        \vspace{20pt}
        
  
    \resumeItemListEnd
  \resumeSubHeadingListEnd
\vspace{-16pt}

%-----------PROGRAMMING SKILLS-----------
\section{Technical Skills}
\begin{itemize}[leftmargin=0in, label={}]
  \normalsize{\item{
    \textbf{Languages}{: JavaScript, C++, C\#, HTML/CSS} \\
    \vspace{2pt}
    \textbf{Backend \& Frameworks}{: Node.js, Express.js, .NET Core} \\
    \vspace{2pt}
    \textbf{Cloud Platforms}{: Azure (Functions, AD, Cosmos DB), AWS} \\
    \vspace{2pt}
    \textbf{Databases}{: MongoDB, MySQL, Cosmos DB} \\
    \vspace{2pt}
    \textbf{DevOps Tools}{: GitHub, Bitbucket, JIRA, Confluence, CI/CD pipelines} \\
  }}
\end{itemize}
 \vspace{-12pt}



    
%-----------PROJECTS-----------
\section{Achievements}
    \vspace{-5pt}
    \resumeSubHeadingListStart
      \resumeProjectHeading
          {\textbf{Smart India Hackathon 2019} $|$ \emph{Winner}}{March 2019}
          \resumeItemListStart
            \resumeItem{Winner for problem statement Autonomous Drone Identification and Alerting System at SIH 2019}
            \resumeItem{Used Unity3D to develop the simulation of autonomous Drone operation in various critical conditions}
            \resumeItem{\href{https://drive.google.com/file/d/1soyy5WygphYj3BX-oofEivpodRVGUb8h/view?usp=drivesdk}{\ \underline {Video link to watch Drone Simulation}}  } 
              
          \resumeItemListEnd
    \resumeSubHeadingListEnd
\vspace{-15pt}

%-----------INVOLVEMENT---------------
\section{Profile Links}
            \resumeItemListStart
            \vspace{6pt}
                \resumeItem{ \href{https://github.com/vibhor-rastogi247}{\raisebox{-0.2\height}\faGithubSquare\  \underline{Github}}}  
                
                \resumeItem{            \href{https://www.linkedin.com/in/vibhor-rastogi/}{\raisebox{-0.2\height}\faLinkedin\ \underline {LinkedIn}}}
                
            \resumeItemListEnd
        
    \resumeSubHeadingListEnd


\end{document}