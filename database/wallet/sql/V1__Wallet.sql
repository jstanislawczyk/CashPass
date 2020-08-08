CREATE DATABASE CashPass;

USE CashPass;

CREATE TABLE Currency (
    Id INT NOT NULL AUTO_INCREMENT,
    CurrencyCode VARCHAR(20),
    CurrencyName VARCHAR(100),
    CONSTRAINT CurrencyPK PRIMARY KEY (Id)
);

CREATE TABLE Wallet (
    Id INT NOT NULL AUTO_INCREMENT,
    AccountNumber VARCHAR(255),
    NameAddress VARCHAR(255),
    AccountHolderType VARCHAR(30),
    AvailableBalance DECIMAL NOT NULL,
    BookingBalance DECIMAL,
    PsuRelations VARCHAR(30),
    Currency INT,
    CONSTRAINT WalletPK PRIMARY KEY (Id),
    CONSTRAINT CurrencyFK FOREIGN KEY (Currency) REFERENCES Currency(Id)
);
