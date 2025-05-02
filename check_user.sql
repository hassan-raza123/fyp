SELECT 
    u.id,
    u.email,
    u.status,
    u.email_verified,
    GROUP_CONCAT(r.name) as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.userId
LEFT JOIN roles r ON ur.roleId = r.id
GROUP BY u.id; 