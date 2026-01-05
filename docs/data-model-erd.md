# EORI Platform - Entity Relationship Diagram

This document provides a visual representation of the EORI Platform data model using Mermaid ERD syntax.

## Complete ERD

```mermaid
erDiagram
    %% ============================================
    %% CORE ORGANIZATIONAL HIERARCHY
    %% ============================================
    DIOCESES {
        uuid id PK
        varchar code UK
        varchar name
        text address
        varchar city
        varchar county
        varchar country
        varchar phone
        varchar email
        varchar website
        varchar bishop_name
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    DEANERIES {
        uuid id PK
        uuid diocese_id FK
        varchar code UK
        varchar name
        text address
        varchar city
        varchar county
        varchar country
        varchar phone
        varchar email
        varchar website
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    PARISHES {
        uuid id PK
        uuid deanery_id FK
        uuid diocese_id FK
        varchar code UK
        varchar name
        date patron_saint_day
        text address
        varchar city
        varchar county
        varchar postal_code
        numeric latitude
        numeric longitude
        varchar phone
        varchar email
        varchar website
        varchar priest_name
        varchar vicar_name
        integer parishioner_count
        integer founded_year
        text notes
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    DEPARTMENTS {
        uuid id PK
        uuid parish_id FK
        varchar code
        varchar name
        text description
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    %% ============================================
    %% AUTHENTICATION & AUTHORIZATION
    %% ============================================
    USERS {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar name
        text address
        text city
        text phone
        boolean is_active
        enum approval_status
        enum role
        uuid parish_id FK
        text_array permissions
        text admin_notes
        varchar reset_token
        timestamp reset_token_expiry
        varchar verification_code
        timestamp verification_code_expiry
        timestamp created_at
        timestamp updated_at
    }
    
    SESSIONS {
        uuid id PK
        uuid user_id FK
        varchar token UK
        timestamp expires_at
        timestamp created_at
    }
    
    ROLES {
        uuid id PK
        varchar name UK
        text description
        timestamp created_at
        timestamp updated_at
    }
    
    PERMISSIONS {
        uuid id PK
        varchar name UK
        text description
        varchar resource
        varchar action
        timestamp created_at
        timestamp updated_at
    }
    
    USER_ROLES {
        uuid id PK
        uuid user_id FK
        uuid role_id FK
        timestamp created_at
    }
    
    ROLE_PERMISSIONS {
        uuid id PK
        uuid role_id FK
        uuid permission_id FK
        timestamp created_at
    }
    
    %% ============================================
    %% PARTNERS & PARISHIONERS
    %% ============================================
    PARTNERS {
        uuid id PK
        uuid parish_id FK
        enum type
        enum category
        varchar code
        varchar first_name
        varchar last_name
        varchar cnp
        date birth_date
        varchar company_name
        varchar cui
        varchar reg_com
        text address
        varchar city
        varchar county
        varchar postal_code
        varchar phone
        varchar email
        varchar bank_name
        varchar iban
        text notes
        boolean is_active
        timestamp created_at
        uuid created_by FK
        timestamp updated_at
        uuid updated_by FK
        timestamp deleted_at
    }
    
    PARISHIONERS {
        uuid id PK
        uuid parish_id FK
        uuid classification_id FK
        varchar first_name
        varchar last_name
        varchar cnp
        date birth_date
        text address
        varchar city
        varchar county
        varchar postal_code
        varchar phone
        varchar email
        date baptism_date
        date confirmation_date
        text notes
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    PARISHIONER_CLASSIFICATIONS {
        uuid id PK
        uuid parish_id FK
        varchar name
        text description
        timestamp created_at
        timestamp updated_at
    }
    
    %% ============================================
    %% DOCUMENT MANAGEMENT (REGISTRATURA)
    %% ============================================
    REGISTER_CONFIGURATIONS {
        uuid id PK
        uuid parish_id FK
        varchar name
        text description
        enum document_type
        varchar numbering_format
        boolean is_default
        timestamp created_at
        timestamp updated_at
    }
    
    GENERAL_REGISTER {
        uuid id PK
        uuid register_configuration_id FK
        uuid parish_id FK
        integer document_number
        integer year
        enum document_type
        date date
        varchar subject
        varchar from
        varchar to
        text description
        text file_path
        enum status
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
        uuid updated_by FK
    }
    
    GENERAL_REGISTER_WORKFLOW {
        uuid id PK
        uuid register_entry_id FK
        varchar status
        uuid assigned_to FK
        text notes
        timestamp created_at
    }
    
    GENERAL_REGISTER_ATTACHMENTS {
        uuid id PK
        uuid register_entry_id FK
        varchar file_name
        text file_path
        integer file_size
        varchar mime_type
        timestamp created_at
    }
    
    DOCUMENT_REGISTRY {
        uuid id PK
        uuid parish_id FK
        integer registration_number
        integer registration_year
        varchar formatted_number
        enum document_type
        date registration_date
        varchar external_number
        date external_date
        uuid sender_partner_id FK
        varchar sender_name
        varchar sender_doc_number
        date sender_doc_date
        uuid recipient_partner_id FK
        varchar recipient_name
        varchar subject
        text content
        enum priority
        enum status
        uuid department_id FK
        uuid assigned_to FK
        date due_date
        date resolved_date
        varchar file_index
        uuid parent_document_id FK
        boolean is_secret
        text_array secret_declassification_list
        uuid created_by FK
        timestamp created_at
        uuid updated_by FK
        timestamp updated_at
        timestamp deleted_at
    }
    
    DOCUMENT_ATTACHMENTS {
        uuid id PK
        uuid document_id FK
        varchar file_name
        text file_path
        integer file_size
        varchar mime_type
        timestamp created_at
    }
    
    DOCUMENT_WORKFLOW {
        uuid id PK
        uuid document_id FK
        varchar status
        uuid assigned_to FK
        text notes
        timestamp created_at
        uuid created_by FK
    }
    
    DOCUMENT_CONNECTIONS {
        uuid id PK
        uuid source_document_id FK
        uuid target_document_id FK
        varchar connection_type
        timestamp created_at
    }
    
    DOCUMENT_ARCHIVE {
        uuid id PK
        uuid document_id FK
        varchar archive_location
        date archive_date
        varchar archive_reference
        timestamp created_at
    }
    
    DOCUMENT_NUMBER_COUNTERS {
        uuid id PK
        uuid parish_id FK
        enum document_type
        integer year
        integer counter
        timestamp created_at
        timestamp updated_at
    }
    
    %% ============================================
    %% ACCOUNTING
    %% ============================================
    INVOICES {
        uuid id PK
        uuid parish_id FK
        varchar series
        numeric number
        varchar invoice_number
        enum type
        date date
        date due_date
        uuid partner_id FK
        numeric amount
        numeric vat
        numeric total
        varchar currency
        enum status
        date payment_date
        text description
        jsonb items
        uuid warehouse_id FK
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
        uuid updated_by FK
    }
    
    CONTRACTS {
        uuid id PK
        uuid parish_id FK
        uuid partner_id FK
        varchar contract_number
        date contract_date
        date start_date
        date end_date
        varchar subject
        text description
        numeric amount
        varchar currency
        varchar status
        uuid template_id FK
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
        uuid updated_by FK
    }
    
    CONTRACT_INVOICES {
        uuid id PK
        uuid contract_id FK
        uuid invoice_id FK
        timestamp created_at
    }
    
    CONTRACT_INVOICE_TEMPLATES {
        uuid id PK
        uuid parish_id FK
        varchar name
        text description
        text template_content
        timestamp created_at
        timestamp updated_at
    }
    
    WAREHOUSES {
        uuid id PK
        uuid parish_id FK
        varchar code
        varchar name
        text address
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    PRODUCTS {
        uuid id PK
        uuid parish_id FK
        uuid warehouse_id FK
        varchar code
        varchar name
        text description
        varchar unit
        numeric purchase_price
        numeric sale_price
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    STOCK_MOVEMENTS {
        uuid id PK
        uuid warehouse_id FK
        uuid product_id FK
        enum movement_type
        numeric quantity
        numeric unit_price
        uuid invoice_id FK
        varchar reference
        text notes
        uuid created_by FK
        timestamp created_at
    }
    
    PAYMENTS {
        uuid id PK
        uuid parish_id FK
        uuid partner_id FK
        date payment_date
        numeric amount
        varchar currency
        varchar payment_method
        varchar reference
        text description
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
    }
    
    %% ============================================
    %% CEMETERIES
    %% ============================================
    CEMETERIES {
        uuid id PK
        uuid parish_id FK
        varchar code
        varchar name
        text address
        varchar city
        varchar county
        numeric total_area
        integer total_plots
        text notes
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    CEMETERY_PARCELS {
        uuid id PK
        uuid cemetery_id FK
        varchar code
        varchar name
        text description
        timestamp created_at
        timestamp updated_at
    }
    
    CEMETERY_ROWS {
        uuid id PK
        uuid parcel_id FK
        integer row_number
        text description
        timestamp created_at
        timestamp updated_at
    }
    
    CEMETERY_GRAVES {
        uuid id PK
        uuid row_id FK
        integer grave_number
        varchar grave_type
        varchar status
        text notes
        timestamp created_at
        timestamp updated_at
    }
    
    CEMETERY_CONCESSIONS {
        uuid id PK
        uuid grave_id FK
        varchar concession_holder_name
        varchar concession_holder_cnp
        date start_date
        date end_date
        varchar concession_number
        text notes
        timestamp created_at
        timestamp updated_at
    }
    
    CEMETERY_CONCESSION_PAYMENTS {
        uuid id PK
        uuid concession_id FK
        date payment_date
        numeric amount
        varchar payment_type
        text notes
        timestamp created_at
    }
    
    BURIALS {
        uuid id PK
        uuid grave_id FK
        varchar deceased_name
        varchar deceased_cnp
        date birth_date
        date death_date
        date burial_date
        varchar priest_name
        text notes
        timestamp created_at
        timestamp updated_at
    }
    
    %% ============================================
    %% LIBRARY
    %% ============================================
    LIBRARY_AUTHORS {
        uuid id PK
        varchar name
        text biography
        timestamp created_at
        timestamp updated_at
    }
    
    LIBRARY_PUBLISHERS {
        uuid id PK
        varchar name
        text address
        timestamp created_at
        timestamp updated_at
    }
    
    LIBRARY_DOMAINS {
        uuid id PK
        varchar name
        text description
        uuid parent_id FK
        timestamp created_at
        timestamp updated_at
    }
    
    LIBRARY_BOOKS {
        uuid id PK
        uuid parish_id FK
        varchar code
        varchar title
        uuid author_id FK
        uuid publisher_id FK
        uuid domain_id FK
        varchar isbn
        integer publication_year
        integer pages
        integer copies
        integer available_copies
        varchar location
        enum status
        boolean is_loanable
        text description
        timestamp created_at
        timestamp updated_at
    }
    
    LIBRARY_LOANS {
        uuid id PK
        uuid book_id FK
        varchar borrower_name
        varchar borrower_contact
        date loan_date
        date due_date
        date return_date
        varchar status
        text notes
        timestamp created_at
        timestamp updated_at
    }
    
    %% ============================================
    %% EVENTS
    %% ============================================
    CHURCH_EVENTS {
        uuid id PK
        uuid parish_id FK
        enum type
        enum status
        date event_date
        varchar location
        varchar priest_name
        text notes
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
        uuid updated_by FK
    }
    
    CHURCH_EVENT_PARTICIPANTS {
        uuid id PK
        uuid event_id FK
        varchar name
        varchar role
        varchar contact
        text notes
        timestamp created_at
    }
    
    CHURCH_EVENT_DOCUMENTS {
        uuid id PK
        uuid event_id FK
        varchar document_type
        varchar file_name
        text file_path
        timestamp created_at
    }
    
    CHURCH_EVENT_EMAIL_SUBMISSIONS {
        uuid id PK
        uuid event_id FK
        varchar email
        jsonb submission_data
        varchar status
        timestamp created_at
    }
    
    %% ============================================
    %% ONLINE FORMS
    %% ============================================
    ONLINE_FORMS {
        uuid id PK
        uuid parish_id FK
        varchar name
        text description
        boolean is_active
        enum email_validation_mode
        enum submission_flow
        enum target_module
        varchar widget_code UK
        text success_message
        text error_message
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
        uuid updated_by FK
    }
    
    ONLINE_FORM_FIELDS {
        uuid id PK
        uuid form_id FK
        varchar field_key
        enum field_type
        varchar label
        varchar placeholder
        text help_text
        boolean is_required
        jsonb validation_rules
        jsonb options
        integer order_index
        timestamp created_at
    }
    
    ONLINE_FORM_FIELD_MAPPINGS {
        uuid id PK
        uuid form_id FK
        varchar field_key
        varchar target_table
        varchar target_column
        jsonb transformation
        timestamp created_at
    }
    
    ONLINE_FORM_SUBMISSIONS {
        uuid id PK
        uuid form_id FK
        varchar submission_token UK
        enum status
        varchar email
        timestamp email_validated_at
        jsonb form_data
        uuid target_record_id
        timestamp submitted_at
        timestamp processed_at
        uuid processed_by FK
    }
    
    ONLINE_FORM_EMAIL_VALIDATIONS {
        uuid id PK
        uuid submission_id FK
        varchar email
        varchar validation_code
        timestamp expires_at
        timestamp verified_at
        timestamp created_at
    }
    
    FORM_MAPPING_DATASETS {
        uuid id PK
        varchar name
        text description
        enum target_module
        uuid parish_id FK
        boolean is_default
        jsonb mappings
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
        uuid updated_by FK
    }
    
    %% ============================================
    %% EMAIL TEMPLATES
    %% ============================================
    EMAIL_TEMPLATES {
        uuid id PK
        varchar name
        varchar subject
        text body
        varchar template_type
        jsonb variables
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    %% ============================================
    %% RELATIONSHIPS
    %% ============================================
    
    %% Core Hierarchy
    DIOCESES ||--o{ DEANERIES : "contains"
    DIOCESES ||--o{ PARISHES : "direct"
    DEANERIES ||--o{ PARISHES : "contains"
    PARISHES ||--o{ DEPARTMENTS : "has"
    PARISHES ||--o{ USERS : "belongs_to"
    
    %% Authentication
    USERS ||--o{ SESSIONS : "has"
    USERS ||--o{ USER_ROLES : "has"
    ROLES ||--o{ USER_ROLES : "assigned_to"
    ROLES ||--o{ ROLE_PERMISSIONS : "has"
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : "granted_to"
    
    %% Partners
    PARISHES ||--o{ PARTNERS : "has"
    PARISHES ||--o{ PARISHIONERS : "has"
    PARISHIONER_CLASSIFICATIONS ||--o{ PARISHIONERS : "classifies"
    
    %% Document Management
    PARISHES ||--o{ REGISTER_CONFIGURATIONS : "has"
    REGISTER_CONFIGURATIONS ||--o{ GENERAL_REGISTER : "configures"
    PARISHES ||--o{ GENERAL_REGISTER : "has"
    GENERAL_REGISTER ||--o{ GENERAL_REGISTER_WORKFLOW : "tracks"
    GENERAL_REGISTER ||--o{ GENERAL_REGISTER_ATTACHMENTS : "has"
    
    PARISHES ||--o{ DOCUMENT_REGISTRY : "has"
    DOCUMENT_REGISTRY ||--o{ DOCUMENT_ATTACHMENTS : "has"
    DOCUMENT_REGISTRY ||--o{ DOCUMENT_WORKFLOW : "tracks"
    DOCUMENT_REGISTRY ||--o{ DOCUMENT_CONNECTIONS : "source"
    DOCUMENT_REGISTRY ||--o{ DOCUMENT_CONNECTIONS : "target"
    DOCUMENT_REGISTRY ||--o{ DOCUMENT_ARCHIVE : "archived_in"
    DEPARTMENTS ||--o{ DOCUMENT_REGISTRY : "assigned_to"
    PARISHES ||--o{ DOCUMENT_NUMBER_COUNTERS : "has"
    
    %% Accounting
    PARISHES ||--o{ INVOICES : "has"
    PARISHES ||--o{ CONTRACTS : "has"
    PARISHES ||--o{ WAREHOUSES : "has"
    PARTNERS ||--o{ INVOICES : "partner_in"
    PARTNERS ||--o{ CONTRACTS : "partner_in"
    CONTRACTS ||--o{ CONTRACT_INVOICES : "generates"
    WAREHOUSES ||--o{ PRODUCTS : "stores"
    WAREHOUSES ||--o{ STOCK_MOVEMENTS : "tracks"
    PRODUCTS ||--o{ STOCK_MOVEMENTS : "moved"
    INVOICES ||--o{ STOCK_MOVEMENTS : "linked_to"
    PARISHES ||--o{ PAYMENTS : "has"
    PARTNERS ||--o{ PAYMENTS : "partner_in"
    
    %% Cemeteries
    PARISHES ||--o{ CEMETERIES : "has"
    CEMETERIES ||--o{ CEMETERY_PARCELS : "contains"
    CEMETERY_PARCELS ||--o{ CEMETERY_ROWS : "contains"
    CEMETERY_ROWS ||--o{ CEMETERY_GRAVES : "contains"
    CEMETERY_GRAVES ||--o{ CEMETERY_CONCESSIONS : "has"
    CEMETERY_CONCESSIONS ||--o{ CEMETERY_CONCESSION_PAYMENTS : "has"
    CEMETERY_GRAVES ||--o{ BURIALS : "contains"
    
    %% Library
    PARISHES ||--o{ LIBRARY_BOOKS : "has"
    LIBRARY_AUTHORS ||--o{ LIBRARY_BOOKS : "authored_by"
    LIBRARY_PUBLISHERS ||--o{ LIBRARY_BOOKS : "published_by"
    LIBRARY_DOMAINS ||--o{ LIBRARY_BOOKS : "categorized_in"
    LIBRARY_DOMAINS ||--o{ LIBRARY_DOMAINS : "parent"
    LIBRARY_BOOKS ||--o{ LIBRARY_LOANS : "loaned"
    
    %% Events
    PARISHES ||--o{ CHURCH_EVENTS : "has"
    CHURCH_EVENTS ||--o{ CHURCH_EVENT_PARTICIPANTS : "has"
    CHURCH_EVENTS ||--o{ CHURCH_EVENT_DOCUMENTS : "has"
    CHURCH_EVENTS ||--o{ CHURCH_EVENT_EMAIL_SUBMISSIONS : "has"
    
    %% Online Forms
    PARISHES ||--o{ ONLINE_FORMS : "has"
    ONLINE_FORMS ||--o{ ONLINE_FORM_FIELDS : "contains"
    ONLINE_FORMS ||--o{ ONLINE_FORM_FIELD_MAPPINGS : "maps"
    ONLINE_FORMS ||--o{ ONLINE_FORM_SUBMISSIONS : "receives"
    ONLINE_FORM_SUBMISSIONS ||--o{ ONLINE_FORM_EMAIL_VALIDATIONS : "validates"
    PARISHES ||--o{ FORM_MAPPING_DATASETS : "has"
    
    %% User References
    USERS ||--o{ GENERAL_REGISTER : "created_by"
    USERS ||--o{ DOCUMENT_REGISTRY : "created_by"
    USERS ||--o{ DOCUMENT_WORKFLOW : "created_by"
    USERS ||--o{ INVOICES : "created_by"
    USERS ||--o{ CHURCH_EVENTS : "created_by"
    USERS ||--o{ ONLINE_FORMS : "created_by"
    USERS ||--o{ ONLINE_FORM_SUBMISSIONS : "processed_by"
    USERS ||--o{ FORM_MAPPING_DATASETS : "created_by"
    USERS ||--o{ PARTNERS : "created_by"
```

## Entity Count Summary

- **Core Entities**: 4 (dioceses, deaneries, parishes, departments)
- **Auth & RBAC**: 6 (users, sessions, roles, permissions, user_roles, role_permissions)
- **Partners**: 3 (partners, parishioners, parishioner_classifications)
- **Document Management**: 11 (register_configurations, general_register, general_register_workflow, general_register_attachments, document_registry, document_attachments, document_workflow, document_connections, document_archive, document_number_counters)
- **Accounting**: 8 (invoices, contracts, contract_invoices, contract_invoice_templates, warehouses, products, stock_movements, payments)
- **Cemeteries**: 7 (cemeteries, cemetery_parcels, cemetery_rows, cemetery_graves, cemetery_concessions, cemetery_concession_payments, burials)
- **Library**: 5 (library_authors, library_publishers, library_domains, library_books, library_loans)
- **Events**: 4 (church_events, church_event_participants, church_event_documents, church_event_email_submissions)
- **Online Forms**: 6 (online_forms, online_form_fields, online_form_field_mappings, online_form_submissions, online_form_email_validations, form_mapping_datasets)
- **Email Templates**: 1 (email_templates)

**Total: 55 entities**

## Key Relationships Summary

1. **Parish-Centric**: Most entities are scoped to parishes for multi-tenant isolation
2. **User Tracking**: Most entities track `created_by` and `updated_by` for audit trails
3. **Workflow Support**: Document management includes comprehensive workflow tracking
4. **Soft Deletes**: Partners and document_registry support soft deletion
5. **File Attachments**: Multiple entities support file attachments
6. **Hierarchical Structures**: Cemeteries, library domains, and organizational hierarchy support nested relationships

