drop table if exists Procurement;
drop table if exists USER;
drop table if exists Invoice;
drop table if exists Payment;
drop table if exists PRC;
drop table if exists CRAC;
drop table if exists Vendor;
CREATE TABLE USER (
  userID INT NOT NULL AUTO_INCREMENT,
  userEmail varchar(255) NOT NULL,
  userName varchar(255) NOT NULL,
  userRole varchar(1) NOT NULL,
  userPassword varchar(255) NOT NULL,
  PRIMARY KEY (userID),
  UNIQUE (userEmail),
  CHECK (
    userRole = '0'
    OR userRole = '1'
    OR userRole = '2'
    OR userRole = '3'
    OR userRole = '4'
  )
);
CREATE TABLE Invoice (
  invoiceNo INT NOT NULL,
  invoiceDocument varchar(255) NOT NULL,
  PRIMARY KEY (invoiceNo)
);
CREATE TABLE Payment (
  paymentID INT NOT NULL AUTO_INCREMENT,
  paymentAmount FLOAT NOT NULL,
  paymentMode VARCHAR(20) NOT NULL,
  transactionID INT NOT NULL,
  PRIMARY KEY (paymentID),
  UNIQUE (transactionID),
  CHECK (
    paymentMode = 'Internet Banking'
    OR paymentMode = 'NEFT'
    OR paymentMode = 'IMPS'
    OR paymentMode = 'RTGS'
  )
);
CREATE TABLE PRC (
  prcNo INT NOT NULL AUTO_INCREMENT,
  prcDate DATE NOT NULL,
  PRIMARY KEY (prcNo)
);
CREATE TABLE CRAC (
  cracNo INT NOT NULL AUTO_INCREMENT,
  cracDate DATE NOT NULL,
  PRIMARY KEY (cracNo)
);
CREATE TABLE Vendor (
  vendorID INT NOT NULL AUTO_INCREMENT,
  vendorOrganization VARCHAR(255) NOT NULL,
  vendorEmail VARCHAR(255) NOT NULL,
  MSME CHAR(1) NOT NULL,
  womenOwned CHAR(1) NOT NULL,
  SCST CHAR(1) NOT NULL,
  PRIMARY KEY (vendorID),
  UNIQUE (vendorEmail),
  CHECK (
    MSME = '0'
    or MSME = '1'
  ),
  CHECK (
    womenOwned = '0'
    or womenOwned = '1'
  ),
  CHECK (
    SCST = '0'
    or SCST = '1'
  )
);
CREATE TABLE Procurement (
  procurementID INT NOT NULL AUTO_INCREMENT,
  gemID INT NOT NULL,
  goodsType VARCHAR(20) NOT NULL,
  goodsQuantity VARCHAR(20) NOT NULL,
  vendorSelection VARCHAR(20) NOT NULL,
  vendorID INT NOT NULL,
  invoiceNo INT NULL,
  prcNo INT NULL,
  cracNo INT NULL,
  paymentID INT NULL,
  procurementStatus CHAR(1) NOT NULL DEFAULT "0",
  procurementBuyer INT NULL,
  procurementConsignee INT NULL,
  procurementPAO INT NULL,
  PRIMARY KEY (procurementID),
  FOREIGN KEY (invoiceNo) REFERENCES Invoice(invoiceNo),
  FOREIGN KEY (paymentID) REFERENCES Payment(paymentID),
  FOREIGN KEY (prcNo) REFERENCES PRC(prcNo),
  FOREIGN KEY (cracNo) REFERENCES CRAC(cracNo),
  FOREIGN KEY (vendorID) REFERENCES Vendor(vendorID),
  FOREIGN KEY (procurementBuyer) REFERENCES USER(userID),
  FOREIGN KEY (procurementConsignee) REFERENCES USER(userID),
  FOREIGN KEY (procurementPAO) REFERENCES USER(userID),
  UNIQUE (gemID),
  UNIQUE (invoiceNo),
  UNIQUE (paymentID),
  UNIQUE (prcNo),
  UNIQUE (cracNo),
  CHECK (
    vendorSelection = 'bidding'
    or vendorSelection = 'direct-purchase'
    or vendorSelection = 'reverse-auction'
  ),
  CHECK (
    procurementStatus = "0"
    or procurementStatus = "1"
    or procurementStatus = "2"
    or procurementStatus = "3"
    or procurementStatus = "4"
  )
);
INSERT INTO USER (userEmail, userName, userRole, userPassword)
VALUES (
    'abhinavramki@gmail.com',
    'Abhinav R',
    '0',
    'abhinav123'
  );
INSERT INTO USER (userEmail, userName, userRole, userPassword)
VALUES (
    'venky@gmail.com',
    'Venkatakrishnan',
    '1',
    'venky123'
  );
INSERT INTO USER (userEmail, userName, userRole, userPassword)
VALUES ('ash@gmail.com', 'Ashwin', '2', 'ash123456');
INSERT INTO USER (userEmail, userName, userRole, userPassword)
VALUES ('sajith@gmail.com', 'Sajith', '3', 'sajith123456');
INSERT INTO USER (userEmail, userName, userRole, userPassword)
VALUES ('vakada@gmail.com', 'Vakada', '4', 'vakada123456');
INSERT INTO INVOICE (invoiceNo, invoiceDocument)
VALUES (923, "C:\\invoice\\923.pdf");
INSERT INTO INVOICE (invoiceNo, invoiceDocument)
VALUES (934, "C:\\invoice\\934.pdf");
INSERT INTO INVOICE (invoiceNo, invoiceDocument)
VALUES (1051, "C:\\invoice\\1051.pdf");
INSERT INTO INVOICE (invoiceNo, invoiceDocument)
VALUES (1227, "C:\\invoice\\1227.pdf");
INSERT INTO INVOICE (invoiceNo, invoiceDocument)
VALUES (7273, "C:\\invoice\\7273.pdf");
INSERT INTO PAYMENT (paymentAmount, paymentMode, transactionID)
VALUES (20000.00, 'Internet Banking', 7894);
INSERT INTO PAYMENT (paymentAmount, paymentMode, transactionID)
VALUES (25000.00, 'NEFT', 9396);
INSERT INTO PAYMENT (paymentAmount, paymentMode, transactionID)
VALUES (45000.00, 'IMPS', 8391);
INSERT INTO PAYMENT (paymentAmount, paymentMode, transactionID)
VALUES (30000.00, 'RTGS', 6653);
INSERT INTO PAYMENT (paymentAmount, paymentMode, transactionID)
VALUES (70000.00, 'NEFT', 1252);
INSERT INTO CRAC (cracDate)
VALUES ('2023-07-20');
INSERT INTO CRAC (cracDate)
VALUES ('2023-08-07');
INSERT INTO CRAC (cracDate)
VALUES ('2023-06-10');
INSERT INTO CRAC (cracDate)
VALUES ('2023-05-14');
INSERT INTO CRAC (cracDate)
VALUES ('2023-05-01');
INSERT INTO PRC (prcDate)
VALUES ('2023-07-15');
INSERT INTO PRC (prcDate)
VALUES ('2023-08-02');
INSERT INTO PRC (prcDate)
VALUES ('2023-06-05');
INSERT INTO PRC (prcDate)
VALUES ('2023-05-09');
INSERT INTO PRC (prcDate)
VALUES ('2023-04-28');
INSERT INTO VENDOR (
    vendorOrganization,
    vendorEmail,
    MSME,
    womenOwned,
    SCST
  )
VALUES (
    'Sajith Enterprises',
    'vakada@gmail.com',
    '1',
    '1',
    '0'
  );
INSERT INTO VENDOR (
    vendorOrganization,
    vendorEmail,
    MSME,
    womenOwned,
    SCST
  )
VALUES (
    'Praveen and co.',
    'praveen@gmail.com',
    '1',
    '0',
    '0'
  );
INSERT INTO VENDOR (
    vendorOrganization,
    vendorEmail,
    MSME,
    womenOwned,
    SCST
  )
VALUES (
    'The Paambu Company',
    'snake@gmail.com',
    '0',
    '1',
    '0'
  );
INSERT INTO VENDOR (
    vendorOrganization,
    vendorEmail,
    MSME,
    womenOwned,
    SCST
  )
VALUES ('Thatha Corp.', 'saravana@gmail.com', '0', '0', '0');
INSERT INTO VENDOR (
    vendorOrganization,
    vendorEmail,
    MSME,
    womenOwned,
    SCST
  )
VALUES ('David and Sons', 'david@gmail.com', '0', '0', '1');
INSERT INTO PROCUREMENT (
    gemID,
    goodsType,
    goodsQuantity,
    vendorSelection,
    vendorID,
    invoiceNo,
    prcNo,
    cracNo,
    paymentID,
    procurementStatus,
    procurementBuyer,
    procurementConsignee,
    procurementPAO
  )
VALUES(
    14554,
    'Coal',
    '100kg',
    'bidding',
    1,
    923,
    1,
    1,
    1,
    "4",
    2,
    3,
    4
  );
INSERT INTO PROCUREMENT (
    gemID,
    goodsType,
    goodsQuantity,
    vendorSelection,
    vendorID,
    invoiceNo,
    prcNo,
    cracNo,
    paymentID,
    procurementStatus,
    procurementBuyer,
    procurementConsignee,
    procurementPAO
  )
VALUES(
    13454,
    'Chair',
    '50pieces',
    'direct-purchase',
    2,
    934,
    2,
    2,
    2,
    "4",
    2,
    3,
    4
  );
INSERT INTO PROCUREMENT (
    gemID,
    goodsType,
    goodsQuantity,
    vendorSelection,
    vendorID,
    invoiceNo,
    prcNo,
    cracNo,
    paymentID,
    procurementStatus,
    procurementBuyer,
    procurementConsignee,
    procurementPAO
  )
VALUES(
    13354,
    'Coal',
    '200kg',
    'bidding',
    3,
    1051,
    3,
    3,
    3,
    "4",
    2,
    3,
    4
  );
INSERT INTO PROCUREMENT(
    gemID,
    goodsType,
    goodsQuantity,
    vendorSelection,
    vendorID,
    invoiceNo,
    prcNo,
    cracNo,
    paymentID,
    procurementStatus,
    procurementBuyer,
    procurementConsignee,
    procurementPAO
  )
VALUES(
    16254,
    'Cement',
    '170kg',
    'bidding',
    4,
    1227,
    4,
    4,
    4,
    "4",
    2,
    3,
    4
  );
INSERT INTO PROCUREMENT(
    gemID,
    goodsType,
    goodsQuantity,
    vendorSelection,
    vendorID,
    invoiceNo,
    prcNo,
    cracNo,
    paymentID,
    procurementStatus,
    procurementBuyer,
    procurementConsignee,
    procurementPAO
  )
VALUES(
    17854,
    'Coal',
    '400kg',
    'direct-purchase',
    5,
    7273,
    5,
    5,
    5,
    "4",
    2,
    3,
    4
  );