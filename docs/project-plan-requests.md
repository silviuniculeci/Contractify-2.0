# Project Plan Request Functionality

This document provides instructions for using and testing the project plan request feature in Contractify.

## Overview

The project plan request feature allows sales team members to request project plans from the operations team. When a project plan is requested, it appears in the projects list for the Business Central specialist user to review and create a detailed project plan.

## Implementation Summary

The following components were updated or created to implement this feature:

1. **ProjectList.tsx**: 
   - Updated to display all project requests for the BC specialist user
   - Added search and filtering capabilities
   - Created a project detail modal view
   - Improved error handling and logging for debugging

2. **ProjectCard.tsx**: 
   - Created a new component to display project information
   - Implemented status badges with appropriate styling
   - Displays client, creation date, and offer information

3. **RequestProjectPlanButton.tsx**: 
   - Enhanced to fetch offer details before creating a project request
   - Now includes title and solution_id in project requests
   - Improved error handling and user feedback

4. **Database Structure**: 
   - Removed references to non-existent fields (assignee_id, requester_id)
   - Updated components to work with the actual database schema

5. **Documentation**: 
   - Created comprehensive documentation with usage instructions
   - Added troubleshooting section and feature overview

## Database Structure

The feature uses the following database tables:

### `project_requests` Table

| Column        | Type           | Description                                           |
|---------------|----------------|-------------------------------------------------------|
| id            | UUID           | Primary key                                           |
| created_at    | timestamp      | When the request was created                          |
| offer_id      | UUID           | Reference to the offer this project plan is for       |
| status        | text           | Current status: 'PENDING', 'IN_PROGRESS', 'COMPLETED' |
| title         | text           | Project title (typically derived from the offer)      |
| solution_id   | text           | Solution identifier                                   |

### `resource_types` Table

Contains predefined resource types that can be assigned to projects.

## How It Works

1. **Request Project Plan**: Sales team members can request a project plan for an offer by clicking the "Request Project Plan" button on the offer details page.

2. **Review Requests**: The Business Central specialist can view all requested project plans on the Projects page. They can filter by status, search by title, and view details for each project.

3. **Create Project Plan**: The specialist can create a detailed project plan for the requested offer, including resource assignments, timelines, and costs.

4. **Update Status**: As work progresses, the status of the project plan can be updated to 'IN_PROGRESS' or 'COMPLETED'.

## Implementation Details

### Sales Team View

- Sales team members see the "Request Project Plan" button on the offer details page.
- They can view the status of their project plan requests on the offers list page.
- A notification is shown when a project plan is requested successfully.

### Business Central Specialist View

- The BC specialist user (with ID `bbdd2a0b-490a-4ea2-955f-340c60e64725`) can see all project plan requests.
- They have a dedicated Projects page where they can manage all requests.
- Project cards show details like client name, created date, and linked offer information.

### Project Detail View

Clicking on a project card opens a detailed view with:
- Project status
- Assigned team member
- Creation date
- Offer value
- Related offer details
- Actions to edit the project or view the related offer

## Testing the Feature

1. **Request a Project Plan**:
   - Navigate to an offer detail page
   - Click the "Request Project Plan" button
   - Verify that you are redirected to the offers list with a notification

2. **View Project Requests**:
   - Log in as the Business Central specialist user
   - Navigate to the Projects page
   - Verify that the requested project appears in the list

3. **View Project Details**:
   - Click on a project card
   - Verify that the project details modal appears with all relevant information
   - Test the "View Offer" button to ensure it navigates to the correct offer

## Troubleshooting

If project requests are not appearing:

1. Check the browser console for errors
2. Verify that the project request was created in the database
3. Make sure you're logged in as the correct user (BC specialist for viewing all requests)
4. Try refreshing the page or clearing the browser cache

## Known Issues and Limitations

- The assignee functionality is not yet implemented
- Comments system is currently showing placeholder data
- Resource assignments are planned for a future release

## Future Enhancements

- Add ability to upload project plan documents
- Implement email notifications for project plan status updates
- Create a dashboard for operations team to track project workload 