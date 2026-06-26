from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import dashboard_service


router = APIRouter(prefix="/dashboard")


@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db)):
    return dashboard_service.get_summary(db)


@router.get("/weekly-sales")
def weekly_sales(db: Session = Depends(get_db)):
    return dashboard_service.get_weekly_sales(db)


@router.get("/recent-orders")
def recent_orders(
    limit: int = Query(default=5, ge=1, le=25),
    db: Session = Depends(get_db),
):
    return dashboard_service.get_recent_orders(db, limit=limit)


@router.get("/top-selling-products")
def top_selling_products(
    limit: int = Query(default=5, ge=1, le=25),
    db: Session = Depends(get_db),
):
    return dashboard_service.get_top_selling_products(db, limit=limit)


@router.get("/low-stock-products")
def low_stock_products(
    threshold: int = Query(default=dashboard_service.LOW_STOCK_THRESHOLD, ge=0),
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    return dashboard_service.get_low_stock_products(
        db,
        threshold=threshold,
        limit=limit,
    )


@router.get("/top-products")
def top_products(db: Session = Depends(get_db)):
    return [
        {"product": product["name"], "sold": product["sold"]}
        for product in dashboard_service.get_top_selling_products(db)
    ]
