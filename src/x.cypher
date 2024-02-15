MATCH (guidestar:Guidestar)-[:EMPLOYS]->(orgPersonRole:OrgPersonRole)
WHERE guidestar.orgName CONTAINS 'פורום קהלת'
MATCH (orgPersonRole)-[:GSTAR_LISTED_NAME]->(guidestarPerson:GuidestarPerson)
MATCH (guidestarPerson)-[:APPEARS_IN_GSTAR]->(otherOrgPersonRole:OrgPersonRole)
OPTIONAL MATCH (otherOrgPersonRole)-[:EMPLOYED_IN]->(otherGuidestar:Guidestar)
RETURN guidestar, orgPersonRole, guidestarPerson, otherOrgPersonRole, otherGuidestar
