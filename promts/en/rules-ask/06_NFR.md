### 4.8. Non-Functional Requirements

**Non-Functional Requirements (NFR) Template**

#### 4.8.1. Content
1. [Introduction](#introduction)
2. [NFR Structure](#nfr-structure)
3. [Main NFR Categories](#main-nfr-categories)
4. [Templates by Categories](#templates-by-categories)
5. [Metrics and Measurements](#metrics-and-measurements)
6. [Tools and Methods](#tools-and-methods)
7. [Checklists](#checklists)
8. [Filling Examples](#filling-examples)

#### 4.8.2. Introduction

Non-Functional Requirements (NFR) define the qualitative characteristics of a system that affect performance, security, reliability, and usability. Unlike functional requirements, NFR describe not *what* the system does, but *how* it does it.

##### 4.8.2.1. Key characteristics of qualitative NFR:
1.  **Measurability** - specific numerical indicators
2.  **Testability** - objective verification
3.  **Realism** - achievability within the project
4.  **Prioritization** - defined priority
5.  **Justification** - importance for the business

#### 4.8.3. NFR Structure

##### 4.8.3.1. Mandatory Elements:
1.  **Unique Identifier** - format: NFR-XXX
2.  **Category Name** - requirement type (Performance, Security, etc.)
3.  **Description** - clear description of what the system must provide
4.  **Measurement Criteria** - specific measurable indicators with units of measurement
5.  **Priority** - Critical/High/Medium/Low
6.  **Justification** - importance for the business

##### 4.8.3.2. Universal NFR Template:

NFR-XXX: [Requirement Name]
Description: [Clear description of what the system must provide]
Measurement Criteria:
- [Criterion 1 with specific values and units of measurement]
- [Criterion 2 with specific values and units of measurement]
- [Measurement and testing conditions]
Priority: [Critical/High/Medium/Low]
Justification: [Why this requirement is important for the business]


#### 4.8.4. Main NFR Categories

##### 4.8.4.1. Performance
- **Response Time**: no more than 2 seconds under load up to 1000 users
- **Throughput**: at least 500 transactions per second
- **Resource Usage**: CPU no more than 70%, memory no more than 2 GB

##### 4.8.4.2. Security
- **Authentication**: multi-factor, lockout after 5 failed attempts
- **Data Protection**: AES-256 encryption, TLS 1.3
- **Authorization**: role check for each request

##### 4.8.4.3. Reliability
- **Availability**: at least 99.9% per month
- **Recovery Time**: no more than 15 minutes after failure
- **Fault Tolerance**: redundancy of critical components

##### 4.8.4.4. Scalability
- **Horizontal**: linear increase when adding servers
- **Vertical**: resource increase gives proportional performance gain
- **Autoscaling**: depending on load

##### 4.8.4.5. Usability
- **Learning Time**: no more than 2 hours for a new user
- **Number of Clicks**: no more than 3 for main operations
- **Accessibility**: compliance with WCAG 2.1 AA

##### 4.8.4.6. Compatibility
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Integration**: REST API, JSON/XML, SSO
- **Platform**: Windows Server 2019+, Linux Ubuntu 20.04+

##### 4.8.4.7. Portability
- **Cross-Platform**: Windows, Linux, Docker, Kubernetes
- **Cloud Deployment**: AWS, Azure, GCP

##### 4.8.4.8. Maintainability
- **Modularity**: clear component boundaries
- **Documentation**: API, test coverage at least 80%
- **Deployment**: no more than 30 minutes for a new version

#### 4.8.5. Templates by Categories

##### 4.8.5.1. Performance

###### 4.8.5.1.1. Performance NFR Template:

NFR-PERF-XXX: [Performance Requirement Name]
Description: [Description of the required system performance]
Measurement Criteria:
- Response Time: [value] [unit] under [load conditions]
- Throughput: [value] [unit]
- Resource Usage: CPU no more than [%], memory no more than [GB]
- Page Load Time: no more than [seconds]
Measurement Conditions:
- Environment: [test environment characteristics]
- Load: [number of users/requests]
- Duration: [testing time]
Tools: [list of measurement tools]
Priority: [Critical/High/Medium/Low]
Justification: [importance for the business]


###### 4.8.5.1.2. Performance NFR Example:

NFR-PERF-001: Product Search Performance
Description: The product search system must provide fast response under high load
Measurement Criteria:
- Search Time: no more than 1 second under 1000 simultaneous requests
- Throughput: 2000 search queries per second
- Result Loading Time: no more than 500 ms (95th percentile)
- CPU Usage: no more than 60% under peak load
Measurement Conditions:
- Environment: 8 CPU, 16 GB RAM, SSD, 100 Mbps network
- Load: 1000 simultaneous users
- Data: 1,000,000 products, 10,000 categories
Tools: Apache JMeter, Gatling, Prometheus
Priority: Critical
Justification: Search speed is critical for sales conversion


##### 4.8.5.2. Security

###### 4.8.5.2.1. Security NFR Template:

NFR-SEC-XXX: [Security Requirement Name]
Description: [Description of the required security measures]
Measurement Criteria:
- Authentication: [methods and parameters]
- Authorization: [access control mechanisms]
- Data Protection: [encryption and protection methods]
- Audit: [logging and monitoring]
Testing Conditions:
- Scenarios: [list of test scenarios]
- Tools: [security testing tools]
- Standards: [compliance with standards]
Priority: [Critical/High/Medium/Low]
Justification: [importance for the business]


###### 4.8.5.2.2. Security NFR Example:

NFR-SEC-001: User Authentication
Description: The system must provide secure user authentication
Measurement Criteria:
- Multi-Factor Authentication: mandatory for administrators
- Account Lockout: after 5 failed attempts for 30 minutes
- Password Complexity: minimum 8 characters, letters+numbers+special characters
- Session Timeout: no more than 8 hours of inactivity
- Password Encryption: bcrypt with salt, minimum 12 rounds
Testing Conditions:
- Scenarios: brute force attacks, password cracking, SQL injections
- Tools: OWASP ZAP, Burp Suite, Metasploit
- Standards: OWASP Top 10, NIST Cybersecurity Framework
Priority: Critical
Justification: Protection of user personal data


##### 4.8.5.3. Reliability

###### 4.8.5.3.1. Reliability NFR Template:

NFR-REL-XXX: [Reliability Requirement Name]
Description: [Description of the required system reliability]
Measurement Criteria:
- Availability: [uptime percentage] in [period]
- Recovery Time (MTTR): no more than [time]
- Mean Time Between Failures (MTBF): at least [time]
- Fault Tolerance: [description of mechanisms]
Testing Conditions:
- Failure Scenarios: [list of test scenarios]
- Recovery Plans: [recovery procedures]
- Monitoring: [metrics and alerts]
Priority: [Critical/High/Medium/Low]
Justification: [importance for the business]


###### 4.8.5.3.2. Reliability NFR Example:

NFR-REL-001: System Availability
Description: The system must provide high availability for users
Measurement Criteria:
- Availability: at least 99.9% per month (maximum 43 minutes downtime)
- Recovery Time (MTTR): no more than 15 minutes after failure
- Mean Time Between Failures (MTBF): at least 720 hours (30 days)
- Scheduled Maintenance: no more than 4 hours per month during off-hours
- Monitoring: 24/7 with alerts if unavailable for more than 1 minute
Testing Conditions:
- Scenarios: server failure, database failure, network failure
- Recovery Plans: automatic failover, backups
- Monitoring: Pingdom, New Relic, custom health checks
Priority: Critical
Justification: System unavailability leads to loss of sales


##### 4.8.5.4. Scalability

###### 4.8.5.4.1. Scalability NFR Template:

NFR-SCAL-XXX: [Scalability Requirement Name]
Description: [Description of the required system scalability]
Measurement Criteria:
- Horizontal Scalability: [number of nodes] with [efficiency]
- Vertical Scalability: [resource increase] gives [performance gain]
- Autoscaling: [conditions and boundaries]
- Performance under Scaling: [metrics]
Testing Conditions:
- Load Scenarios: [test scaling scenarios]
- Architectural Decisions: [architecture description]
- Monitoring: [scaling metrics]
Priority: [Critical/High/Medium/Low]
Justification: [importance for the business]


###### 4.8.5.4.2. Scalability NFR Example:

NFR-SCAL-001: Web Server Horizontal Scalability
Description: The system must scale linearly when adding servers
Measurement Criteria:
- Linear Scaling: doubling servers gives performance gain of 1.8-2.0 times
- Maximum Number of Servers: up to 20 servers in a cluster
- Autoscaling: adding servers when CPU > 70% for more than 5 minutes
- Server Removal: when CPU < 30% for more than 10 minutes
- Load Balancing: even distribution with deviation no more than 10%
Testing Conditions:
- Scenarios: gradual load increase, peak loads
- Architecture: stateless application, shared database, load balancer
- Monitoring: CPU, memory, number of servers, response time
Priority: High
Justification: Supporting user growth without degradation


##### 4.8.5.5. Usability

###### 4.8.5.5.1. Usability NFR Template:

NFR-USAB-XXX: [Usability Requirement Name]
Description: [Description of the required usability]
Measurement Criteria:
- Learning Time: no more than [time] for [user type]
- Number of Clicks: no more than [number] for [operation]
- Accessibility: compliance with [standard] level [level]
- Navigation Ease: [navigation metrics]
Testing Conditions:
- Users: [types of test users]
- Scenarios: [test usage scenarios]
- Tools: [UX testing tools]
Priority: [Critical/High/Medium/Low]
Justification: [importance for the business]


###### 4.8.5.5.2. Usability NFR Example:

NFR-USAB-001: Product Search Usability
Description: Product search must be intuitive and fast
Measurement Criteria:
- Search Time: no more than 3 clicks from main page to result
- Autocomplete: suggestions appear after entering 2 characters
- Filters: no more than 5 main filters on the page
- Sorting: minimum 3 sorting options (price, popularity, novelty)
- Mobile Version: responsive design for screens from 320px
- Accessibility: compliance with WCAG 2.1 AA
Testing Conditions:
- Users: 20 users of different ages and experience
- Scenarios: search by name, category, filters
- Tools: UserTesting, Hotjar, Google Analytics
Priority: High
Justification: Search convenience affects conversion


##### 4.8.5.6. Compatibility

###### 4.8.5.6.1. Compatibility NFR Template:

NFR-COMP-XXX: [Compatibility Requirement Name]
Description: [Description of the required compatibility]
Measurement Criteria:
- Browser Compatibility: [list of browsers and versions]
- Platform Compatibility: [operating systems]
- Integration Compatibility: [APIs and protocols]
- Backward Compatibility: [versions and migrations]
Testing Conditions:
- Test Environment: [list of test environments]
- Tools: [compatibility testing tools]
- Automation: [automated compatibility tests]
Priority: [Critical/High/Medium/Low]
Justification: [importance for the business]


###### 4.8.5.6.2. Compatibility NFR Example:

NFR-COMP-001: Browser Compatibility
Description: Web interface must work in all modern browsers
Measurement Criteria:
- Chrome: versions 90+ (supporting 95% of users)
- Firefox: versions 88+ (supporting 90% of users)
- Safari: versions 14+ on macOS and iOS (supporting 85% of users)
- Edge: versions 90+ (supporting 80% of users)
- Functionality: 100% of functions work in all supported browsers
- Performance: page load time deviation no more than 20% between browsers
- Responsive Design: correct display on screens 320px-1920px
Testing Conditions:
- Environment: BrowserStack, Sauce Labs, real devices
- Tools: Selenium, Playwright, Browser DevTools
- Automation: cross-browser tests in CI/CD
Priority: High
Justification: Reaching maximum user audience


##### 4.8.5.7. Portability

###### 4.8.5.7.1. Portability NFR Template:

NFR-PORT-XXX: [Portability Requirement Name]
Description: [Description of the required system portability]
Measurement Criteria:
- Cross-Platform: [list of supported platforms]
- Cloud Portability: [supported cloud providers]
- Containerization: [containerization requirements]
- Deployment: [deployment time and procedures]
Testing Conditions:
- Deployment Environment: [list of test environments]
- Tools: [portability testing tools]
- Automation: [automated deployment procedures]
Priority: [Critical/High/Medium/Low]
Justification: [importance for the business]


###### 4.8.5.7.2. Portability NFR Example:

NFR-PORT-001: Cloud Portability
Description: The system must be portable between cloud providers
Measurement Criteria:
- Supported Providers: AWS, Azure, GCP, DigitalOcean
- Containerization: Docker containers for all components
- Orchestration: Kubernetes for container management
- Infrastructure as Code: Terraform for all cloud resources
- Deployment Time: no more than 30 minutes to a new environment
- Configuration: environment variables for all settings
- Database: support for PostgreSQL, MySQL, MongoDB
Testing Conditions:
- Environment: testing on all supported providers
- Tools: Terraform, Docker, Kubernetes, Helm
- Automation: CI/CD pipeline for all providers
Priority: Medium
Justification: Flexibility in choosing cloud provider


##### 4.8.5.8. Maintainability

###### 4.8.5.8.1. Maintainability NFR Template:

NFR-MAINT-XXX: [Maintainability Requirement Name]
Description: [Description of the required system maintainability]
Measurement Criteria:
- Modularity: [structure and module boundaries]
- Documentation: [documentation requirements]
- Testing: [test coverage and types]
- Deployment: [update time and procedures]
Testing Conditions:
- Code Quality Metrics: [tools and threshold values]
- Procedures: [support and update procedures]
- Monitoring: [maintainability metrics]
Priority: [Critical/High/Medium/Low]
Justification: [importance for the business]


###### 4.8.5.8.2. Maintainability NFR Example:

NFR-MAINT-001: Code Quality and Testing
Description: Code must be of high quality and well tested
Measurement Criteria:
- Test Coverage: at least 80% for unit tests, 60% for integration tests
- Code Quality: SonarQube score at least A (0 technical debt)
- Documentation: README for each module, API documentation
- Modularity: clear boundaries between components, loose coupling
- Coding Standards: ESLint/Prettier for JavaScript, Pylint for Python
- Build Time: no more than 10 minutes for full build
- Testing Time: no more than 15 minutes for all tests
Testing Conditions:
- Metrics: SonarQube, Jest coverage, ESLint
- Procedures: code review, pair programming, automated testing
- Monitoring: regular code quality reports
Priority: High
Justification: Code quality affects development speed


#### 4.8.6. Metrics and Measurements

##### 4.8.6.1. Rules for Describing Metrics

###### 4.8.6.1.1 ✅ Correct:

- Load Time: no more than 2 seconds under load up to 1000 users
- Availability: at least 99.9% per month
- Throughput: 1000 requests per second
- Security: lockout after 5 failed attempts for 30 minutes


###### 4.8.6.1.2 ❌ Incorrect:

- Load Time: fast
- Availability: high
- Throughput: many requests
- Security: secure system


##### 4.8.6.2. Testing Conditions

Measurement Conditions:
- Environment: Production-like (8 CPU, 16 GB RAM, SSD)
- Load: 1000 simultaneous users
- Duration: 1 hour
- Data: 100,000 records
- Network: 100 Mbps, latency 50 ms


#### 4.8.7. Tools and Methods

##### 4.8.7.1. Key Tools by Category:
- **Performance**: Apache JMeter, Lighthouse, New Relic
- **Security**: OWASP ZAP, SonarQube, Burp Suite
- **Reliability**: Nagios, Zabbix, Prometheus
- **Usability**: Google Analytics, Hotjar, UserTesting

##### 4.8.7.2. Measurement Methods:
- **Load Testing**: Apache JMeter, Gatling
- **Monitoring**: Prometheus + Grafana, New Relic
- **Security Analysis**: OWASP ZAP, Nessus
- **Usability Testing**: A/B tests, session recordings

#### 4.8.8. Checklists

##### 4.8.8.1. General NFR Checklist:
- [ ] Requirement is measurable and testable
- [ ] Specific numerical values with units of measurement are specified
- [ ] Requirement priority is defined
- [ ] Requirement does not contradict other NFRs
- [ ] Requirement is realistic for the project
- [ ] Justification of importance for the business is provided
- [ ] Measurement and testing conditions are defined
- [ ] Measurement tools are specified

##### 4.8.8.2. Checklists by Categories:

###### 4.8.8.2.1. Performance
- [ ] Target and threshold response time values are specified
- [ ] Load and testing conditions are described
- [ ] Measurement tools are provided

###### 4.8.8.2.2. Security
- [ ] Protection methods and tools are described
- [ ] Standards and compliance are specified
- [ ] Test scenarios are provided

###### 4.8.8.2.3. Reliability
- [ ] Availability and recovery metrics are specified
- [ ] Redundancy plans are described
- [ ] Failure scenarios are provided

###### 4.8.8.2.4. Scalability
- [ ] Scaling strategies are described
- [ ] Threshold values are specified
- [ ] Architectural decisions are provided

##### 4.8.8.3. Common Mistakes:
1.  **Vague Formulations**: "fast" instead of "no more than 2 seconds"
2.  **Missing Units of Measurement**: "1000 users" instead of "1000 simultaneous users"
3.  **Unrealistic Requirements**: "10 milliseconds" instead of "100 milliseconds"
4.  **Missing Justification**: NFR without specifying business importance
5.  **Contradictory Requirements**: NFRs that contradict each other

##### 4.8.8.4. Practical Recommendations:
- Include methods and measurement tools for each NFR
- Specify testing conditions and environment
- Define threshold values and degradation scenarios
- Document conflicts and compromises
- Use versioning and change control
- Link NFRs to architectural decisions
- Regularly update documentation

#### 4.8.9. Filling Examples

##### 4.8.9.1. Example 1: E-commerce Web Application


NFR-PERF-001: Main Page Performance
Description: Main page must load quickly for all users
Measurement Criteria:
- Load Time: no more than 2 seconds under load up to 1000 users
- Page Size: no more than 2 MB
- Number of HTTP Requests: no more than 50
- Action Response Time: no more than 1 second (95th percentile)
Measurement Conditions:
- Environment: 4 CPU, 8 GB RAM, 100 Mbps network
- Browser: Chrome 90+
- Cache: disabled
Tools: Lighthouse, WebPageTest, Apache JMeter
Priority: High
Justification: Load speed affects bounce rate and conversion



NFR-SEC-001: Personal Data Protection
Description: The system must ensure security of user personal data
Measurement Criteria:
- Data Encryption: AES-256 for data at rest, TLS 1.3 for data in transit
- Authentication: multi-factor for administrators, 2FA for users
- Account Lockout: after 5 failed attempts for 30 minutes
- Audit: logging of all operations with personal data
- Compliance: GDPR, PCI DSS for payment data
Testing Conditions:
- Scenarios: penetration testing, vulnerability assessment
- Tools: OWASP ZAP, Burp Suite, Nessus
- Standards: OWASP Top 10, NIST Cybersecurity Framework
Priority: Critical
Justification: Compliance with regulatory requirements and reputation protection


##### 4.8.9.2. Example 2: Mobile Application


NFR-USAB-001: Mobile Application Usability
Description: Mobile application must be intuitive for users
Measurement Criteria:
- Learning Time: no more than 30 minutes for a new user
- Number of Steps: no more than 3 for main operations
- Button Size: minimum 44x44 pixels for easy tapping
- Gesture Support: swipe, pinch-zoom, long press
- Offline Mode: operation without internet for main functions
- Accessibility: compliance with WCAG 2.1 AA
Testing Conditions:
- Devices: iOS 14+, Android 10+, various screen sizes
- Users: testing with real users
- Tools: Firebase Analytics, Crashlytics, UserTesting
Priority: High
Justification: Usability is critical for user retention



NFR-COMP-001: Mobile Platform Compatibility
Description: Application must work on all supported mobile platforms
Measurement Criteria:
- iOS: versions 14+ (supporting 95% of iOS users)
- Android: versions 10+ (supporting 90% of Android users)
- Screen Sizes: from 320px to 428px in width
- Pixel Density: from 1x to 3x
- Orientation: portrait and landscape
- Performance: response time deviation no more than 15% between platforms
Testing Conditions:
- Devices: real devices and emulators
- Tools: Firebase Test Lab, Appium, XCTest
- Automation: cross-platform tests in CI/CD
Priority: High
Justification: Reaching maximum mobile user audience


##### 4.8.9.3. Example 3: API Service


NFR-PERF-002: REST API Performance
Description: REST API must provide high throughput
Measurement Criteria:
- Response Time: no more than 200 ms (99th percentile)
- Throughput: 5000 requests per second
- Latency: no more than 50 ms under normal load
- Rate Limiting: 1000 requests per minute per API Key
- Caching: TTL 5 minutes for frequently requested data
Measurement Conditions:
- Environment: 4 CPU, 8 GB RAM, 1 Gbps network
- Load: 1000 RPS for 1 hour
- Data: 1,000,000 records in the database
Tools: Artillery, k6, New Relic, Prometheus
Priority: High
Justification: API is used by mobile applications and partners



NFR-SCAL-002: API Scalability
Description: API must scale to support load growth
Measurement Criteria:
- Horizontal Scaling: linear increase up to 20 servers
- Autoscaling: adding servers when CPU > 70%
- Load Balancing: even distribution with deviation no more than 5%
- Database: read replicas for reading, connection pooling
- Caching: Redis cluster for distributed caching
Testing Conditions:
- Scenarios: gradual load increase, stress testing
- Architecture: microservices, API Gateway, service mesh
- Monitoring: performance and scaling metrics
Priority: High
Justification: Supporting growth of users and partner integrations


Use these examples as a benchmark for creating high-quality non-functional requirements.