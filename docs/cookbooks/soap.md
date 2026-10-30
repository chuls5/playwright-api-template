# SOAP (deferred)

No reachable public SOAP API was found for calibration (dneonline 500, w3schools 403), so this is untested here.
Cases when needed: envelope with correct namespace + `SOAPAction`; valid request → schema-valid response (parse XML, don't regex); invalid input → `soap:Fault` with faultcode; WS-Security header missing/expired → fault. Use Playwright `request.post` with `Content-Type: text/xml`.
