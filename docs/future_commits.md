# Future Commit Messages

## Responsibility 3: Applications API (Core Ingestion)

**Commit Message:**
```
feat(api): implement applications endpoint for candidate ingestion
```

**Description:**
```
- Create api/v1/applications route in Next.js
- Insert candidate data directly into Supabase
- Enable native data entry without third-party services
- Add basic validation and error handling
```

---

## Responsibility 4: AWS S3 Setup + File Upload Utility

**Commit Message:**
```
feat(storage): configure S3 and implement CV upload utility
```

**Description:**
```
- Set up AWS S3 bucket and access policies
- Implement Next.js utility for file uploads
- Enable CV storage and integration with candidate workflow
```

---

## Responsibility 5: End-to-End Integration & Testing

**Commit Message:**
```
test(e2e): validate full data flow from API to database and storage
```

**Description:**
```
- Test candidate creation via API
- Verify data persistence in Supabase
- Confirm CV uploads to S3
- Ensure seamless integration across backend components
```

---

## Quick Copy Commands

```bash
# Responsibility 3
git commit -m "feat(api): implement applications endpoint for candidate ingestion" -m "- Create api/v1/applications route in Next.js
- Insert candidate data directly into Supabase
- Enable native data entry without third-party services
- Add basic validation and error handling"

# Responsibility 4
git commit -m "feat(storage): configure S3 and implement CV upload utility" -m "- Set up AWS S3 bucket and access policies
- Implement Next.js utility for file uploads
- Enable CV storage and integration with candidate workflow"

# Responsibility 5
git commit -m "test(e2e): validate full data flow from API to database and storage" -m "- Test candidate creation via API
- Verify data persistence in Supabase
- Confirm CV uploads to S3
- Ensure seamless integration across backend components"
```
