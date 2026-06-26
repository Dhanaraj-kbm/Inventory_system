from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.invoice import Invoice, InvoiceItem
from app.models.product import Product


LOW_STOCK_THRESHOLD = 10


def get_summary(db: Session):
    total_sales = db.query(func.count(Invoice.id)).scalar() or 0
    total_revenue = db.query(func.coalesce(func.sum(Invoice.total), 0)).scalar() or 0
    total_products = db.query(func.count(Product.id)).scalar() or 0
    low_stock_products = (
        db.query(func.count(Product.id))
        .filter(func.coalesce(Product.stock, 0) <= LOW_STOCK_THRESHOLD)
        .scalar()
        or 0
    )

    return {
        "total_sales": total_sales,
        "total_revenue": float(total_revenue),
        "total_products": total_products,
        "low_stock_products": low_stock_products,
    }


def get_weekly_sales(db: Session):
    today = datetime.utcnow().date()
    start_date = today - timedelta(days=6)

    rows = (
        db.query(
            func.date(Invoice.created_at).label("sale_date"),
            func.count(Invoice.id).label("orders"),
            func.coalesce(func.sum(Invoice.total), 0).label("revenue"),
        )
        .filter(Invoice.created_at >= datetime.combine(start_date, datetime.min.time()))
        .group_by(func.date(Invoice.created_at))
        .order_by(func.date(Invoice.created_at))
        .all()
    )

    sales_by_date = {
        str(row.sale_date): {
            "orders": row.orders,
            "revenue": float(row.revenue or 0),
        }
        for row in rows
    }

    return [
        {
            "date": (start_date + timedelta(days=offset)).isoformat(),
            "orders": sales_by_date.get(
                (start_date + timedelta(days=offset)).isoformat(),
                {"orders": 0},
            )["orders"],
            "revenue": sales_by_date.get(
                (start_date + timedelta(days=offset)).isoformat(),
                {"revenue": 0},
            )["revenue"],
        }
        for offset in range(7)
    ]


def get_recent_orders(db: Session, limit: int = 5):
    rows = (
        db.query(
            Invoice.id,
            Invoice.invoice_number,
            Invoice.customer_name,
            Invoice.total,
            Invoice.created_at,
            func.coalesce(func.sum(InvoiceItem.quantity), 0).label("items_sold"),
        )
        .outerjoin(InvoiceItem, Invoice.id == InvoiceItem.invoice_id)
        .group_by(
            Invoice.id,
            Invoice.invoice_number,
            Invoice.customer_name,
            Invoice.total,
            Invoice.created_at,
        )
        .order_by(Invoice.created_at.desc(), Invoice.id.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "invoice_id": row.id,
            "invoice_number": row.invoice_number,
            "customer_name": row.customer_name,
            "total": float(row.total or 0),
            "created_at": row.created_at,
            "items_sold": int(row.items_sold or 0),
        }
        for row in rows
    ]


def get_top_selling_products(db: Session, limit: int = 5):
    rows = (
        db.query(
            Product.id,
            Product.name,
            Product.sku,
            func.sum(InvoiceItem.quantity).label("sold"),
            func.sum(InvoiceItem.quantity * InvoiceItem.price).label("revenue"),
        )
        .join(InvoiceItem, Product.id == InvoiceItem.product_id)
        .group_by(Product.id, Product.name, Product.sku)
        .order_by(func.sum(InvoiceItem.quantity).desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "product_id": row.id,
            "name": row.name,
            "sku": row.sku,
            "sold": int(row.sold or 0),
            "revenue": float(row.revenue or 0),
        }
        for row in rows
    ]


def get_low_stock_products(
    db: Session,
    threshold: int = LOW_STOCK_THRESHOLD,
    limit: int = 10,
):
    products = (
        db.query(Product)
        .filter(func.coalesce(Product.stock, 0) <= threshold)
        .order_by(func.coalesce(Product.stock, 0), Product.name)
        .limit(limit)
        .all()
    )

    return [
        {
            "product_id": product.id,
            "name": product.name,
            "sku": product.sku,
            "barcode": product.barcode,
            "stock": product.stock or 0,
            "threshold": threshold,
        }
        for product in products
    ]
