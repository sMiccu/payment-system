from django.db import models

# Create your models here.
class Store(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name

class DailyStoreSales(models.Model):
    date = models.DateField(auto_now_add=True)
    store = models.ForeignKey(Store, on_delete=models.CASCADE, null=True, related_name='dailystoresales')
    cash_sales = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    paypay_sales = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_sales = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.store} : {self.date}"
    
class DurationRate(models.Model):
    id = models.AutoField(primary_key=True)
    store = models.ForeignKey(Store, on_delete=models.CASCADE, null=True, related_name='durationrate')
    minutes = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    membership_price = models.IntegerField()
    general_price = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.id} : {self.minutes}"
