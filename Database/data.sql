drop table if exists USER;
drop table if exists Procurement;
drop table if exists Invoice;
drop table if exists Payment;
drop table if exists PRC;
drop table if exists CRAC;
drop table if exists Vendor;
CREATE TABLE USER 
(
  userEmail varchar(255) NOT NULL,
  userName varchar(255) NOT NULL,
  userRole varchar(1) NOT NULL,
  userPassword varchar(255) NOT NULL,
  CHECK (userRole = '0' OR userRole = '1' OR userRole = '2' OR userRole = '3'  OR userRole = '4') 
);
CREATE TABLE Invoice
(
  Invoice_No INT NOT NULL,
  Invoice_document INT NOT NULL,
  PRIMARY KEY (Invoice_No)
);
CREATE TABLE Payment
(
  Payment_ID INT NOT NULL AUTO_INCREMENT,
  Payment_amount FLOAT NOT NULL,
  Payment_mode VARCHAR(20) NOT NULL,
  Transaction_ID INT NOT NULL,
  PRIMARY KEY (Payment_ID),
  UNIQUE (Transaction_ID),
  CHECK (Payment_mode = 'Internet Banking' OR Payment_mode = 'NEFT' OR Payment_mode = 'IMPS' OR Payment_mode = 'RTGS')
);
CREATE TABLE PRC
(
  PRC_No INT NOT NULL AUTO_INCREMENT,
  PRC_Date DATE NOT NULL,
  PRIMARY KEY (PRC_No)
);
CREATE TABLE CRAC
(
  CRAC_No INT NOT NULL AUTO_INCREMENT,
  CRAC_Date DATE NOT NULL,
  PRIMARY KEY (CRAC_No)
);
CREATE TABLE Vendor
(
  Vendor_ID INT NOT NULL AUTO_INCREMENT,
  Vendor_Organization VARCHAR(255) NOT NULL,
  Vendor_Email VARCHAR(255) NOT NULL,
  MSME CHAR(1) NOT NULL,
  Women_Owned CHAR(1) NOT NULL,
  SC_ST CHAR(1) NOT NULL,
  PRIMARY KEY (Vendor_ID),
  UNIQUE (Vendor_Email),
  CHECK (MSME='0' or MSME='1'),
  CHECK (Women_Owned='0' or Women_Owned='1'),
  CHECK (SC_St='0' or SC_ST='1')
);
CREATE TABLE Procurement
(
  Procurement_ID INT  NOT NULL AUTO_INCREMENT,
  GeM_ID INT NOT NULL,
  goods_type VARCHAR(20) NOT NULL,
  goods_quantity VARCHAR(20) NOT NULL,
  vendor_selection VARCHAR(20) NOT NULL,
  Vendor_ID INT NOT NULL,
  Invoice_No INT NULL,
  PRC_No INT NULL,
  CRAC_No INT NULL,
  Payment_ID INT NULL,
  PRIMARY KEY (Procurement_ID),
  FOREIGN KEY (Invoice_No) REFERENCES Invoice(Invoice_No),
  FOREIGN KEY (Payment_ID) REFERENCES Payment(Payment_ID),
  FOREIGN KEY (PRC_No) REFERENCES PRC(PRC_No),
  FOREIGN KEY (CRAC_No) REFERENCES CRAC(CRAC_No),
  FOREIGN KEY (Vendor_ID) REFERENCES Vendor(Vendor_ID),
  UNIQUE (GeM_ID),
  UNIQUE (Invoice_No),
  UNIQUE (Payment_ID),
  UNIQUE (PRC_No),
  UNIQUE (CRAC_No),
  CHECK (vendor_selection = 'bidding' or vendor_selection = 'direct-purchase' or vendor_selection = 'reverse-auction')
);

INSERT INTO USER (userEmail, userName, userRole, userPassword) VALUES ('abhinavramki@gmail.com','Abhinav R','0','abhinav123');
INSERT INTO USER (userEmail, userName, userRole, userPassword) VALUES ('venky@gmail.com','Venkatakrishnan','1','venky123');
INSERT INTO USER (userEmail, userName, userRole, userPassword) VALUES ('ash@gmail.com','Ashwin','2','ash123');
INSERT INTO USER (userEmail, userName, userRole, userPassword) VALUES ('sajith@gmail.com','Sajith','3','sajith123');
INSERT INTO USER (userEmail, userName, userRole, userPassword) VALUES ('vakada@gmail.com','Vakada','4','vakada123');

INSERT INTO INVOICE (INVOICE_NO, INVOICE_DOCUMENT) VALUES (923,1);
INSERT INTO INVOICE (INVOICE_NO, INVOICE_DOCUMENT) VALUES (934,1);
INSERT INTO INVOICE (INVOICE_NO, INVOICE_DOCUMENT) VALUES (1051,1);
INSERT INTO INVOICE (INVOICE_NO, INVOICE_DOCUMENT) VALUES (1227,1);
INSERT INTO INVOICE (INVOICE_NO, INVOICE_DOCUMENT) VALUES (7273,1);

INSERT INTO PAYMENT (PAYMENT_AMOUNT, PAYMENT_MODE, TRANSACTION_ID) VALUES (20000.00,'Internet Banking',7894);
INSERT INTO PAYMENT (PAYMENT_AMOUNT, PAYMENT_MODE, TRANSACTION_ID) VALUES (25000.00,'NEFT',9396);
INSERT INTO PAYMENT (PAYMENT_AMOUNT, PAYMENT_MODE, TRANSACTION_ID) VALUES (45000.00,'IMPS',8391);
INSERT INTO PAYMENT (PAYMENT_AMOUNT, PAYMENT_MODE, TRANSACTION_ID) VALUES (30000.00,'RTGS',6653);
INSERT INTO PAYMENT (PAYMENT_AMOUNT, PAYMENT_MODE, TRANSACTION_ID) VALUES (70000.00,'NEFT',1252);

INSERT INTO CRAC (CRAC_Date) VALUES ('2023-07-20');
INSERT INTO CRAC (CRAC_Date) VALUES ('2023-08-07');
INSERT INTO CRAC (CRAC_Date) VALUES ('2023-06-10');
INSERT INTO CRAC (CRAC_Date) VALUES ('2023-05-14');
INSERT INTO CRAC (CRAC_Date) VALUES ('2023-05-01');

INSERT INTO PRC (PRC_Date) VALUES ('2023-07-15');
INSERT INTO PRC (PRC_Date) VALUES ('2023-08-02');
INSERT INTO PRC (PRC_Date) VALUES ('2023-06-05');
INSERT INTO PRC (PRC_Date) VALUES ('2023-05-09');
INSERT INTO PRC (PRC_Date) VALUES ('2023-04-28');

INSERT INTO VENDOR (Vendor_Organization, Vendor_Email, MSME, Women_Owned, SC_ST) VALUES ('Sajith Enterprises','vakada@gmail.com','1','1','0');
INSERT INTO VENDOR (Vendor_Organization, Vendor_Email, MSME, Women_Owned, SC_ST) VALUES ('Praveen and co.','praveen@gmail.com','1','0','0');
INSERT INTO VENDOR (Vendor_Organization, Vendor_Email, MSME, Women_Owned, SC_ST) VALUES ('The Paambu Company','snake@gmail.com','0','1','0');
INSERT INTO VENDOR (Vendor_Organization, Vendor_Email, MSME, Women_Owned, SC_ST) VALUES ('Thatha Corp.','saravana@gmail.com','0','0','0');
INSERT INTO VENDOR (Vendor_Organization, Vendor_Email, MSME, Women_Owned, SC_ST) VALUES ('David and Sons','david@gmail.com','0','0','1');

INSERT INTO PROCUREMENT (GeM_ID,goods_type,goods_quantity,vendor_selection,vendor_ID,Invoice_No, PRC_No, CRAC_No, Payment_ID) VALUES(14554,'Coal','100kg','bidding',1,923,1,1,1);
INSERT INTO PROCUREMENT (GeM_ID,goods_type,goods_quantity,vendor_selection,vendor_ID,Invoice_No, PRC_No, CRAC_No, Payment_ID) VALUES(13454,'Chair','50pieces','direct-purchase',2,934,2,2,2);
INSERT INTO PROCUREMENT (GeM_ID,goods_type,goods_quantity,vendor_selection,vendor_ID,Invoice_No, PRC_No, CRAC_No, Payment_ID) VALUES(13354,'Coal','200kg','bidding',3,1051,3,3,3);
INSERT INTO PROCUREMENT(GeM_ID,goods_type,goods_quantity,vendor_selection,vendor_ID,Invoice_No, PRC_No, CRAC_No, Payment_ID) VALUES(16254,'Cement','170kg','bidding',4,1227,4,4,4);
INSERT INTO PROCUREMENT(GeM_ID,goods_type,goods_quantity,vendor_selection,vendor_ID,Invoice_No, PRC_No, CRAC_No, Payment_ID) VALUES(17854,'Coal','400kg','direct-purchase',5,7273,5,5,5);




