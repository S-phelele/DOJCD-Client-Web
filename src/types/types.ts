// types.js
/**
 * @typedef {Object} UserData
 * @property {string} [title]
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} email
 * @property {string} [phone_number]
 * @property {string} [region]
 * @property {string} [persal_id]
 * @property {string} [department_id]
 * @property {'Advocate'|'Magistrate'} [user_type]
 * @property {'Admin'|'MTN_Staff'|'Warehouse'|'Approver'} [user_role]
 * @property {string} password
 */

/**
 * @typedef {Object} ClientUser
 * @property {number} client_user_id
 * @property {string} [title]
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} email
 * @property {string} [phone_number]
 * @property {string} [region]
 * @property {string} [persal_id]
 * @property {string} [department_id]
 * @property {'Advocate'|'Magistrate'} user_type
 * @property {string} [network_provider]
 * @property {number} [contract_duration_months]
 * @property {string} [contract_end_date]
 * @property {'Pending'|'Profile_Completed'|'Verified'|'Rejected'} registration_status
 * @property {string} [verification_notes]
 * @property {string} created_at
 */

/**
 * @typedef {Object} OperationalUser
 * @property {number} [op_user_id]
 * @property {string} [title]
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} email
 * @property {'Admin'|'MTN_Staff'|'Warehouse'|'Approver'} user_role
 * @property {string} password
 * @property {string} created_at
 */

/**
 * @typedef {Object} FileData
 * @property {string} uri
 * @property {string} name
 * @property {string} type
 * @property {number} [size]
 */

/**
 * @typedef {Object} CompleteProfileData
 * @property {string} network_provider
 * @property {number} contract_duration_months
 * @property {string} contract_end_date
 * @property {FileData} [invoice_file]
 * @property {FileData} [id_document]
 * @property {FileData} [payslip_document]
 * @property {FileData} [residence_document]
 */

/**
 * @typedef {Object} UploadInvoiceData
 * @property {string} file_data
 * @property {string} filename
 * @property {string} [mime_type]
 */

/**
 * @typedef {Object} LoginData
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} SystemUser
 * @property {number} id
 * @property {'client'|'operational'} user_type
 * @property {string|null} [user_role]
 * @property {string|null} [title]
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} email
 * @property {string|null} [phone_number]
 * @property {string|null} [region]
 * @property {string|null} [persal_id]
 * @property {string|null} [department_id]
 * @property {'Pending'|'Profile_Completed'|'Verified'|'Rejected'|null} [registration_status]
 * @property {string} created_at
 */

/**
 * @typedef {Object} UserStats
 * @property {Object} client_users
 * @property {Array<{registration_status: string, count: string}>} client_users.stats
 * @property {number} client_users.total
 * @property {number} [client_users.this_month]
 * @property {Object} operational_users
 * @property {Array<{user_role: string, count: string}>} operational_users.stats
 * @property {number} operational_users.total
 * @property {number} total_users
 */

/**
 * @typedef {Object} UpdateUserStatusData
 * @property {'Pending'|'Verified'|'Rejected'} status
 * @property {string} notes
 */

/**
 * @typedef {Object} FileObject
 * @property {string} uri
 * @property {string} name
 * @property {string} [type]
 * @property {number} [size]
 */

/**
 * @typedef {Object} CombinedUser
 * @property {number} id
 * @property {'client'|'operational'} user_category
 * @property {string} role
 * @property {string} [title]
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} email
 * @property {string} [phone_number]
 * @property {string} [region]
 * @property {string} created_at
 */

/**
 * @typedef {Object} RecentRegistration
 * @property {'client'|'operational'} user_type
 * @property {number} id
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} email
 * @property {string} registration_status
 * @property {string} created_at
 */

/**
 * @typedef {Object} SearchResult
 * @property {'client'|'operational'} user_type
 * @property {number} id
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} email
 * @property {string} [phone_number]
 * @property {string} [persal_id]
 * @property {string} registration_status
 * @property {string} [client_user_type]
 */

/**
 * @typedef {Object} DashboardData
 * @property {UserStats} statistics
 * @property {RecentRegistration[]} recent_registrations
 * @property {ActivitySummary} activity_summary
 */

/**
 * @typedef {Object} ActivitySummary
 * @property {Array<{client_user_id: number, first_name: string, last_name: string, application_count: number}>} top_applicants
 * @property {Array<{client_user_id: number, first_name: string, last_name: string, order_count: number}>} top_ordered_users
 * @property {number} active_contracts
 */