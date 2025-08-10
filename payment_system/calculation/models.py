from django.db import models

# Create your models here.
class Calculation(models.Model):
    id = models.AutoField(primary_key=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=10, decimal_places=2)
    term = models.IntegerField()
    payment_date = models.DateField()
    payment_amount = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return str(self.id)
