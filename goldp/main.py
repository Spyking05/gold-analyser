from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from passlib.context import CryptContext
from pydantic import BaseModel

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# User model
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    # Relationship to gold records
    gold_records = relationship("GoldRecord", back_populates="user")

# GoldRecord model
class GoldRecord(Base):
    __tablename__ = "gold_records"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    currency = Column(String)
    gold_price_per_gram = Column(Float)
    amount_in_currency = Column(Float)
    calculated_gold = Column(Float)

    user = relationship("User", back_populates="gold_records")

# Create database tables
Base.metadata.create_all(bind=engine)

# Pydantic models
class UserCreate(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True  # Use 'from_attributes' instead of 'orm_mode'

class GoldRecordCreate(BaseModel):
    currency: str
    gold_price_per_gram: float
    amount_in_currency: float
    calculated_gold: float

class GoldRecordResponse(BaseModel):
    id: int
    currency: str
    gold_price_per_gram: float
    amount_in_currency: float
    calculated_gold: float

    class Config:
        from_attributes = True  # Use 'from_attributes' instead of 'orm_mode'

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# User registration
@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    try:
        db_user = db.query(User).filter(User.username == user.username).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Username already registered")
        hashed_password = pwd_context.hash(user.password)
        new_user = User(username=user.username, hashed_password=hashed_password)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {"message": "User created successfully"}
    except Exception as e:
        print(f"Error during registration: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# User login with OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.username == form_data.username).first()
        if not user or not pwd_context.verify(form_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return {
            "access_token": user.username,
            "token_type": "bearer",
            "user_id": user.id  # Include user ID in the response
        }
    except Exception as e:
        print(f"Error during login: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Fetch all users
@app.get("/users", response_model=list[UserResponse])
def get_users(db: Session = Depends(get_db)):
    try:
        users = db.query(User).all()
        return users
    except Exception as e:
        print(f"Error fetching users: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Add a new gold record for a user
@app.post("/users/{user_id}/gold_records", response_model=GoldRecordResponse)
def create_gold_record(user_id: int, gold_record: GoldRecordCreate, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        new_record = GoldRecord(
            user_id=user_id,
            currency=gold_record.currency,
            gold_price_per_gram=gold_record.gold_price_per_gram,
            amount_in_currency=gold_record.amount_in_currency,
            calculated_gold=gold_record.calculated_gold
        )
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        return new_record
    except Exception as e:
        print(f"Error creating gold record: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Fetch all gold records for a user
@app.get("/users/{user_id}/gold_records", response_model=list[GoldRecordResponse])
def get_gold_records(user_id: int, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        gold_records = db.query(GoldRecord).filter(GoldRecord.user_id == user_id).all()
        
        # Check if the user has any gold records
        if not gold_records:
            print(f"No gold records found for user ID: {user_id}")  # Debug info
        else:
            print(f"Fetched gold records for user {user_id}: {gold_records}")  # Debug info
            
        return gold_records
    except Exception as e:
        print(f"Error fetching gold records: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Endpoint to calculate and store gold records
@app.post("/calculate_gold/{user_id}")
def calculate_gold(user_id: int, request: GoldRecordCreate, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Use the provided gold price from the request
        gold_price_per_gram = request.gold_price_per_gram  

        # Calculate the amount of gold
        calculated_gold = request.amount_in_currency / gold_price_per_gram

        # Create a new gold record
        new_record = GoldRecord(
            user_id=user_id,
            currency=request.currency,
            gold_price_per_gram=gold_price_per_gram,
            amount_in_currency=request.amount_in_currency,
            calculated_gold=calculated_gold
        )
        
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        return {"message": "Gold record added successfully", "record": new_record}
    
    except Exception as e:
        print(f"Error calculating gold: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to the Gold Price Converter API"}
