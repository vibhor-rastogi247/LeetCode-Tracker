%-------------------------
% Resume in Latex
% Author : Vibhor Rastogi (C++ Role Version)
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

\pdfgentounicode=1

\newcommand{\resumeItem}[1]{
  \item\small{#1 \vspace{-2pt}}
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

\newcommand{\resumeItemListStart}{\begin{itemize}}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%

\begin{document}

\begin{center}
    {\Huge \scshape Vibhor Rastogi} \\ \vspace{2pt}
    Noida, India \\ \vspace{7pt}
    \small \raisebox{-0.1\height}\faPhone
    +91-9450474480~ {\raisebox{-0.2\height}\faEnvelope\  vibhor.rastogi247@gmail.com} ~ 
    \href{https://www.linkedin.com/in/vibhor-rastogi/}{\raisebox{-0.2\height}\faLinkedin\ \underline{linkedin.com/in/vibhor-rastogi}}  
\end{center}

\section{Experience Summary}  \vspace{2pt}
\resumeItemListStart
  \resumeItem{4.5+ years of experience in backend development, with increasing focus on C++-based system-level problem solving.}
  \resumeItem{Hands-on experience designing microservices and serverless systems deployed on Azure/AWS platforms.}
  \resumeItem{Recently transitioned to leveraging C++ for performance-critical applications and low-latency services.}
  \resumeItem{Strong foundation in data structures, algorithms, debugging, and system design — demonstrated through production-grade projects.}
  \resumeItem{Currently upskilling in modern C++ (C++17/20), STL, memory management, multithreading, and real-time systems.}
\resumeItemListEnd

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
  \vspace{-2pt}
\section{Experience}
\resumeSubheading
  {AppInventiv}{June 2023 -- Present}
  {Software Engineer}{Noida, India}
\resumeItemListStart
  \resumeItem{Contributed to backend services powering major restaurant brands across the Middle East using Node.js and Azure.}
  \resumeItem{Designed \textbf{DeltaChanges} system to propagate menu updates in real-time across devices using push notifications.}
  \resumeItem{Implemented RBAC using Azure AD to handle user-specific access across multi-brand environments.}
  \resumeItem{Optimized and maintained critical services, preparing to rearchitect some for better performance using C++.}
\resumeItemListEnd

\resumeSubheading
  {DLT Labs}{Oct 2020 -- May 2023}
  {Software Engineer}{Noida, India}
\resumeItemListStart
  \resumeItem{Developed multiple scalable microservices for enterprise applications.}
  \resumeItem{Focused on service design, API integration, and backend stability under load.}
  \resumeItem{Participated in architecture discussions and system optimization tasks.}
\resumeItemListEnd

\section{Technical Skills}
\begin{itemize}[leftmargin=0in, label={}]
  \normalsize{\item{
    \textbf{Languages}{: C++, JavaScript, C\#, HTML/CSS} \\
    \vspace{2pt}
    \textbf{Backend \& Frameworks}{: Node.js, Express.js, .NET Core} \\
    \vspace{2pt}
    \textbf{C++ Topics}{: STL, Pointers, Smart Pointers, RAII, Multithreading, Memory Management} \\
    \vspace{2pt}
    \textbf{Cloud}{: Azure (Functions, Cosmos DB, AD), AWS} \\
    \vspace{2pt}
    \textbf{DevOps Tools}{: GitHub, Bitbucket, JIRA, Confluence, CI/CD} \\
    \vspace{2pt}
    \textbf{Databases}{: MongoDB, MySQL, Cosmos DB} \\
  }}
\end{itemize}

\section{Achievements}
\resumeItemListStart
  \resumeItem{\textbf{Smart India Hackathon 2019 Winner}: Built an autonomous drone simulator using Unity3D and Blender for DRDO use case.}
\resumeItemListEnd
%-----------EDUCATION-----------
% \section{Profile Links}
% \resumeItemListStart
%   \resumeItem{\href{https://github.com/vibhor-rastogi247}{\raisebox{-0.2\height}\faGithubSquare\ \underline{GitHub}}}
%   \resumeItem{\href{https://www.linkedin.com/in/vibhor-rastogi/}{\raisebox{-0.2\height}\faLinkedin\ \underline{LinkedIn}}}
% \resumeItemListEnd
%-----------EDUCATION-----------

\end{document}
