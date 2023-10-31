drop table if exists Procurement;
drop table if exists USER;
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
    userRole = '0'     -- 0 - admin
    OR userRole = '1'  -- 1 - buyer
    OR userRole = '2'  -- 2 - consignee
    OR userRole = '3'  -- 3 - PAO
    OR userRole = '4'  -- 4 - vendor
  )
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
    OR paymentMode = 'Other'
  )
);
CREATE TABLE PRC (
  prcNo INT NOT NULL AUTO_INCREMENT,
  file_name VARCHAR(255) NOT NULL,
  prcDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (prcNo)
);
CREATE TABLE CRAC (
  cracNo INT NOT NULL AUTO_INCREMENT,
  file_name VARCHAR(255) NOT NULL,
  cracDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
  invoiceNo INT NOT NULL,
  prcNo INT NULL,
  cracNo INT NULL,
  paymentID INT NULL,
  procurementStatus CHAR(1) NOT NULL DEFAULT "0",
  procurementBuyer INT NOT NULL,
  procurementConsignee INT NULL,
  procurementPAO INT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (procurementID),
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
    procurementStatus = "0"     -- 0 - Waiting for PRC
    or procurementStatus = "1"  -- 1 - Waiting for CRAC || PRC Done
    or procurementStatus = "2"  -- 2 - Waiting for Payment || CRAC Done
    or procurementStatus = "3"  -- 3 - Completed || Payment Done
    or procurementStatus = "4"  -- 4 - Cancelled
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
VALUES ('ash@gmail.com', 'Ashwin', '0', '267cc9179965323feff48ca29ac366872c095b0762207b17384b1d1cd77c06c7');
-- ash123456
INSERT INTO USER (userEmail, userName, userRole, userPassword)
VALUES ('sajith@gmail.com', 'Sajith', '3', '9fddbb5a442df0b1626b0f4d7c130054bbd2b8f88e170af158eb31a3e47095c6');
-- sajith123456
INSERT INTO USER (userEmail, userName, userRole, userPassword)
VALUES ('vakada@gmail.com', 'Vakada', '4', '9983a7a829ab413a2344d8d537f7176c561670ddbe854c4494d4c98f2b49bd20');
-- vakada123456
INSERT INTO USER (userEmail, userName, userRole, userPassword)
VALUES ('praveen@gmail.com', 'Praveen', '4', 'f2a3d9801533509d935c573517e762a2929c2b510e9c32883009e6deec9cc6eb');
-- praveen123456
INSERT INTO USER (userEmail, userName, userRole, userPassword)
VALUES ('snake@gmail.com', 'The Paambu Company', '4', 'e87280d86acf143f89577fd142a9afdb02fe7d3a2b3a46f57d6926761086d30c');
-- paambu123456
INSERT INTO USER (userEmail, userName, userRole, userPassword)
VALUES ('saravana@gmail.com', 'Thatha Corp.', '4', 'd38625a6d6b3c10a55d7ac84637a56ad83a8374c01897f84aded4168c8e3c217');
-- thatha123456
INSERT INTO USER (userEmail, userName, userRole, userPassword)
VALUES ('david@gmail.com', 'David', '4', '17626d12d8599b78c121afbe0da2009f84afcb6549f804b5a1dc36d10565965c');
-- david123456
-- INSERT INTO Payment (paymentAmount, paymentMode, transactionID)
-- VALUES (20000.00, 'Internet Banking', 7894);
-- INSERT INTO Payment (paymentAmount, paymentMode, transactionID)
-- VALUES (25000.00, 'NEFT', 9396);
-- INSERT INTO Payment (paymentAmount, paymentMode, transactionID)
-- VALUES (45000.00, 'IMPS', 8391);
-- INSERT INTO Payment (paymentAmount, paymentMode, transactionID)
-- VALUES (30000.00, 'RTGS', 6653);
-- INSERT INTO Payment (paymentAmount, paymentMode, transactionID)
-- VALUES (70000.00, 'NEFT', 1252);
INSERT INTO Vendor (
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
INSERT INTO Vendor (
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
INSERT INTO Vendor (
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
INSERT INTO Vendor (
    vendorOrganization,
    vendorEmail,
    MSME,
    womenOwned,
    SCST
  )
VALUES ('Thatha Corp.', 'saravana@gmail.com', '0', '0', '0');
INSERT INTO Vendor (
    vendorOrganization,
    vendorEmail,
    MSME,
    womenOwned,
    SCST
  )
VALUES ('David and Sons', 'david@gmail.com', '0', '0', '1');
INSERT INTO Procurement (
    gemID,
    goodsType,
    goodsQuantity,
    vendorSelection,
    vendorID,
    invoiceNo,
    procurementStatus,
    procurementBuyer
  )
VALUES(
    14554,
    'Coal',
    '100kg',
    'bidding',
    1,
    923,
    "0",
    2
  );
INSERT INTO Procurement (
    gemID,
    goodsType,
    goodsQuantity,
    vendorSelection,
    vendorID,
    invoiceNo,
    procurementStatus,
    procurementBuyer
  )
VALUES(
    13454,
    'Chair',
    '50pieces',
    'direct-purchase',
    2,
    934,
    "0",
    2
  );
INSERT INTO Procurement (
    gemID,
    goodsType,
    goodsQuantity,
    vendorSelection,
    vendorID,
    invoiceNo,
    procurementStatus,
    procurementBuyer
  )
VALUES(
    13354,
    'Coal',
    '200kg',
    'bidding',
    3,
    1051,
    "0",
    2
  );
INSERT INTO Procurement(
    gemID,
    goodsType,
    goodsQuantity,
    vendorSelection,
    vendorID,
    invoiceNo,
    procurementStatus,
    procurementBuyer
  )
VALUES(
    16254,
    'Cement',
    '170kg',
    'bidding',
    4,
    1227,
    "0",
    2
  );
INSERT INTO Procurement(
    gemID,
    goodsType,
    goodsQuantity,
    vendorSelection,
    vendorID,
    invoiceNo,
    procurementStatus,
    procurementBuyer
  )
VALUES(
    17854,
    'Coal',
    '400kg',
    'direct-purchase',
    5,
    7273,
    "0",
    2
  );
