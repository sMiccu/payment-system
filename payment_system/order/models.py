from django.db import models
from customer.models import Customer
from menu.models import Menu

# Create your models here.
class Order(models.Model):
    """注文情報（カート全体）"""
    id = models.AutoField(primary_key=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='order')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Order #{self.id} - {self.customer.name}"

class OrderItem(models.Model):
    """注文明細（個別商品の情報）"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='orderitem')
    menu = models.ForeignKey(Menu, on_delete=models.CASCADE, related_name='orderitem')
    quantity = models.PositiveIntegerField(default=1)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.subtotal = self.quantity * self.menu.price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.menu.name} x {self.quantity}"
