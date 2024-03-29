# Balance-Test-Dashboard

| Index                                               | Description                                             |
| :-------------------------------------------------- | :------------------------------------------------------ |
| [High Level Architecture](#High-Level-Architecture) | High level overview illustrating component interactions |
| [Deployment](#Deployment-Guide)                     | How to deploy the project                               |
| [User Guide](#User-Guide)                           | The working solution                                    |
| [Files/Directories](#Files-And-Directories)         | Important files/directories in the project              |
| [Changelog](#Changelog)                             | Any changes post publish                                |
| [Credits](#Credits)                                 | Meet the team behind the solution                       |
| [License](#License)                                 | License details                                         |

# High Level Architecture

The following architecture diagram illustrates the various AWS components utliized to deliver the solution. For an in-depth explanation of the frontend and backend stacks, refer to the [Architecture Deep Dive](docs/ArchitectureDeepDive.md).

![Alt text](docs/images/architecture_diagram.png)

# Deployment Guide

To deploy this solution, please follow the steps laid out in the [Deployment Guide](docs/DeploymentGuide.md)

# User Guide

For instructions on how to navigate the Dashboard interface, refer to the [Dashboard User Guide](docs/UserGuide.md).

# Files And Directories

```text
.
├── amplify
├── backend/
├── node_modules
├── frontend
│   ├── src/
│   |   ├── pages
│   │   ├── components/
│   │   │   ├── nav/
│   │   │   ├── patient/
│   │   │   ├── patient_list/
|   │   ├── graphql/
├── .gitignore
├── .graphqlconfig.yml
├── package-lock.json
├── package.json
└── README.md
```

1. **`/backend`**: Contains all the backend code for the site
2. **`/docs`**: Contains all relevant documentation files
3. **`/src`**: Contains all the frontend source code for the dashboard.
   1. **`/components`**: Reusable React components.
      - Components are organized into folders, with the folder names being the page name/functionality that the components within are used for
      - Components that are not in any subfolders are used on multiple different pages, or for overall app functionality. 
   2. **`/graphql`**: Contains files for mutations, queries and the schema

# Changelog

N/A

# Credits

This application was architected and developed by Minting Fu, Rohit Murali, and Marvin Wu with guidance from the UBC CIC technical and project management teams.

# License

This project is distributed under the [MIT License](LICENSE).
